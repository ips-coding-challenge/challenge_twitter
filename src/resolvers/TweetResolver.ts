import { ApolloError } from 'apollo-server'
import {
  Arg,
  Authorized,
  Ctx,
  FieldResolver,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
} from 'type-graphql'
import AddTweetPayload from '../dto/AddTweetPayload'
import Preview from '../entities/Preview'
import Tweet, { TweetTypeEnum } from '../entities/Tweet'
import User from '../entities/User'
import { MyContext } from '../types/types'
import { selectCountsForTweet } from '../utils/utils'

@Resolver((of) => Tweet)
class TweetResolver {
  @Query(() => [Tweet])
  @Authorized()
  async feed(@Ctx() ctx: MyContext) {
    const { db, userId } = ctx

    const followedUsers = await db('followers')
      .where({
        follower_id: userId,
      })
      .pluck('following_id')

    const tweets = await db('tweets')
      .whereIn('user_id', followedUsers)
      .orWhere('user_id', userId)
      .orderBy('id', 'desc')
      .select(selectCountsForTweet(db))
      .limit(20)

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

  @FieldResolver(() => Boolean)
  async isLiked(@Root() tweet: Tweet, @Ctx() ctx: MyContext) {
    const {
      userId,
      dataloaders: { isLikedDataloader },
    } = ctx

    if (!userId) return false

    const isLiked = await isLikedDataloader.load({
      tweet_id: tweet.id,
      user_id: userId,
    })

    return isLiked !== undefined
  }

  @FieldResolver(() => Boolean)
  async isRetweeted(@Root() tweet: Tweet, @Ctx() ctx: MyContext) {
    const {
      userId,
      dataloaders: { isRetweetedDataloader },
    } = ctx

    if (!userId) return false

    const isRetweeted = await isRetweetedDataloader.load({
      tweet_id: tweet.id,
      user_id: userId,
    })

    return isRetweeted !== undefined
  }

  @FieldResolver(() => Boolean)
  async isBookmarked(@Root() tweet: Tweet, @Ctx() ctx: MyContext) {
    const {
      userId,
      dataloaders: { isBookmarkedDataloader },
    } = ctx

    if (!userId) return false

    const isBookmarked = await isBookmarkedDataloader.load({
      tweet_id: tweet.id,
      user_id: userId,
    })

    return isBookmarked !== undefined
  }

  @FieldResolver(() => Preview)
  async preview(@Root() tweet: Tweet, @Ctx() ctx: MyContext) {
    const {
      dataloaders: { previewLinkDataloader },
    } = ctx

    return await previewLinkDataloader.load(tweet.id)
  }

  @Mutation(() => Tweet)
  @Authorized()
  async addTweet(
    @Arg('payload') payload: AddTweetPayload,
    @Ctx() ctx: MyContext
  ) {
    const { db, userId, bus } = ctx
    const { body, hashtags, url, type, parent_id } = payload

    if (parent_id) {
      const [tweetExists] = await db('tweets').where('id', parent_id)
      if (!tweetExists) {
        throw new ApolloError('Tweet not found')
      }
    }

    try {
      const [tweet] = await db('tweets')
        .insert({
          body,
          type,
          parent_id,
          user_id: userId,
        })
        .returning('*')

      // Send the event to scrap the preview
      if (url) {
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
