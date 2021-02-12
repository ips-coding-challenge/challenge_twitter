import { ApolloError } from 'apollo-server'
import {
  Arg,
  Args,
  ArgsType,
  Authorized,
  Ctx,
  Field,
  FieldResolver,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
} from 'type-graphql'
import AddTweetPayload from '../dto/AddTweetPayload'
import LikeRetweetAuthor from '../entities/LikeRetweetAuthor'
import Media from '../entities/Media'
import Preview from '../entities/Preview'
import Tweet, { TweetTypeEnum } from '../entities/Tweet'
import TweetUserInfos from '../entities/TweetUserInfo'
import User from '../entities/User'
import { Filters } from '../repositories/TweetRepository'
import { MyContext } from '../types/types'

@ArgsType()
class ArgsFilters {
  @Field(() => Int, { nullable: true })
  limit?: number = 20

  @Field(() => Int, { nullable: true })
  offset?: number = 0

  @Field(() => Filters, { nullable: true })
  filter?: Filters = Filters.TWEETS_RETWEETS
}

@Resolver((of) => Tweet)
class TweetResolver {
  @Query(() => [Tweet])
  @Authorized()
  async feed(@Ctx() ctx: MyContext) {
    const {
      userId,
      repositories: { tweetRepository, followerRepository },
    } = ctx

    const followedUsers = await followerRepository.findAll(
      userId!,
      'following_id'
    )

    const tweets = tweetRepository.feed(userId!, followedUsers)

    return tweets
  }

  @Query(() => [Tweet])
  @Authorized()
  async tweets(
    @Args() { limit, offset, filter }: ArgsFilters,
    @Arg('user_id') user_id: number,
    @Ctx() ctx: MyContext
  ) {
    const {
      repositories: { tweetRepository },
    } = ctx

    const tweets = await tweetRepository.tweets(user_id, limit, offset, filter)

    return tweets
  }

  @Query(() => [Tweet])
  async comments(@Arg('parent_id') parent_id: number, @Ctx() ctx: MyContext) {
    const { db } = ctx

    const comments = await db('tweets').where({
      parent_id,
      type: TweetTypeEnum.COMMENT,
    })

    return comments
  }

  @FieldResolver(() => User)
  async user(@Root() tweet: Tweet, @Ctx() ctx: MyContext) {
    const {
      dataloaders: { userDataloader },
    } = ctx

    return await userDataloader.load(tweet.user_id)
  }

  @FieldResolver(() => Tweet, { nullable: true })
  async parent(@Root() tweet: Tweet, @Ctx() ctx: MyContext) {
    const {
      dataloaders: { parentTweetDataloader },
    } = ctx

    if (!tweet.parent_id) return null

    return await parentTweetDataloader.load(tweet.parent_id!)
  }

  @FieldResolver(() => TweetTypeEnum)
  type(@Root() tweet: Tweet) {
    console.log('tweet', tweet)
    if (tweet.original_tweet_id) {
      return TweetTypeEnum.RETWEET
    }
    return tweet.type
  }

  @FieldResolver(() => TweetUserInfos)
  async tweetUserInfos(@Root() tweet: Tweet, @Ctx() ctx: MyContext) {
    const {
      userId,
      dataloaders: { tweetUserInfosDataloader },
    } = ctx

    const results = await tweetUserInfosDataloader.load({
      tweet_id: tweet.id,
      user_id: userId,
    })

    return {
      isLiked: results
        ? results.id === tweet.id && results.infos.includes('liked')
        : false,
      isRetweeted: results
        ? results.id === tweet.id && results.infos.includes('retweeted')
        : false,
      isBookmarked: results
        ? results.id === tweet.id && results.infos.includes('bookmarked')
        : false,
    }
  }

  @FieldResolver(() => Preview)
  async preview(@Root() tweet: Tweet, @Ctx() ctx: MyContext) {
    const {
      dataloaders: { previewLinkDataloader },
    } = ctx

    return await previewLinkDataloader.load(tweet.id)
  }

  @FieldResolver(() => Media)
  async media(@Root() tweet: Tweet, @Ctx() ctx: MyContext) {
    const {
      dataloaders: { mediaDataloader },
    } = ctx

    return await mediaDataloader.load(tweet.id)
  }

  @FieldResolver(() => LikeRetweetAuthor, { nullable: true })
  likeAuthor(@Root() tweet: Tweet) {
    if (!tweet.like_author) return null

    const splitted = tweet.like_author.split(',')

    return {
      display_name: splitted[0],
      username: splitted[1],
    }
  }

  @FieldResolver(() => LikeRetweetAuthor, { nullable: true })
  retweetAuthor(@Root() tweet: Tweet) {
    if (!tweet.retweet_author) return null

    const splitted = tweet.retweet_author.split(',')
    console.log('splitted', splitted)

    return {
      display_name: splitted[0],
      username: splitted[1],
    }
  }

  @Mutation(() => Tweet)
  @Authorized()
  async addTweet(
    @Arg('payload') payload: AddTweetPayload,
    @Ctx() ctx: MyContext
  ) {
    const { db, userId, bus } = ctx
    const { body, hashtags, url, type, parent_id, media } = payload

    if (parent_id) {
      const [tweetExists] = await db('tweets').where('id', parent_id)
      if (!tweetExists) {
        throw new ApolloError('Tweet not found')
      }
    }

    try {
      let tweet: any
      let newMedia: any
      await db.transaction(async (trx) => {
        ;[tweet] = await db('tweets')
          .insert({
            body,
            type,
            parent_id,
            user_id: userId,
          })
          .returning('*')
          .transacting(trx)

        if (media) {
          ;[newMedia] = await db('medias')
            .insert({
              url: media,
              user_id: userId,
              tweet_id: tweet.id,
            })
            .returning(['id', 'url'])
            .transacting(trx)
        }
      })

      // Send the event to scrap the preview
      // I don't want to scrap the preview is a media is uploaded
      if (url && !media) {
        bus.emit('scrap', url, tweet.id)
      }

      if (hashtags && hashtags?.length > 0) {
        const hashTagToInsert = hashtags.map((h) => {
          return {
            hashtag: h,
          }
        })
        try {
          // Insert the hashtags
          const hashTagsIds = await db('hashtags')
            .insert(hashTagToInsert)
            .onConflict('hashtag')
            .merge()
            .returning('id')

          // Insert the relation betweet hashtag and the tweet
          const toInsert = hashTagsIds.map((id) => {
            return {
              hashtag_id: id,
              tweet_id: tweet.id,
            }
          })
          await db('hashtags_tweets').insert(toInsert)
        } catch (e) {
          console.log('e', e)
        }
      }

      // I add the differents counts as there not nullable and
      // I need them in the frontend.
      return {
        ...tweet,
        likesCount: 0,
        commentsCount: 0,
        retweetsCount: 0,
        bookmarksCount: 0,
        media: newMedia ?? null,
      }
    } catch (e) {
      throw new ApolloError(e.message)
    }
  }

  @Mutation(() => Int)
  @Authorized()
  async deleteTweet(@Arg('id') id: number, @Ctx() ctx: MyContext) {
    const { db, userId } = ctx

    try {
      const [tweet] = await db('tweets').where({
        id,
        user_id: userId,
      })

      if (!tweet) {
        throw new ApolloError('Tweet not found')
      }

      // Return the number of affected rows
      return await db('tweets').where({ id, user_id: userId }).del()
    } catch (e) {
      throw new ApolloError(e.message)
    }
  }
}

export default TweetResolver
