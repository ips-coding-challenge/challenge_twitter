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
import LikeRetweetAuthor from '../entities/LikeRetweetAuthor'
import Media from '../entities/Media'
import Preview from '../entities/Preview'
import Tweet, { TweetTypeEnum } from '../entities/Tweet'
import TweetUserInfos from '../entities/TweetUserInfo'
import TweetUserInfo from '../entities/TweetUserInfo'
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

    const select = [
      'tweets.id',
      'tweets.body',
      'tweets.user_id',
      'tweets.parent_id',
      'tweets.visibility',
      'tweets.type',
      ...selectCountsForTweet(db),
    ]

    const tweets = await db
      .from(
        db
          // I do a union from 3 subqueries
          .union(
            [
              // First Query
              // I select the tweets from the tweets table
              // and it will return the tweets and comments
              db
                .select([
                  ...select,
                  'tweets.created_at',
                  db.raw('NULL as like_author'), // Need to have the same number of columns for
                  db.raw('NULL as retweet_author'), // all the 3 queries
                ])
                .from('tweets')
                // I want the tweets/comments from the followedUsers and
                // those from the connected user
                .whereIn('tweets.user_id', [...followedUsers, userId]),
              // SECOND Query
              db
                .select([
                  ...select,
                  'likes.created_at',
                  // I concat the display_name and username
                  // I will need that to show "Like by @user" in the client
                  db.raw(
                    `concat (users.display_name,',', users.username) as like_author`
                  ),
                  db.raw('NULL'),
                ])
                .from('tweets')
                .innerJoin('likes', 'likes.tweet_id', '=', 'tweets.id')
                .innerJoin('users', 'users.id', '=', 'likes.user_id')
                // I only want the likes from the followedUsers
                .whereIn('tweets.id', function () {
                  this.select('l.tweet_id')
                    .from('likes as l')
                    .whereIn('l.user_id', followedUsers)
                })
                // And if the user liked and retweeted the tweet, I "ignore" the like
                .whereNotIn('tweets.id', function () {
                  this.select('retweets.tweet_id')
                    .from('retweets')
                    .whereIn('retweets.user_id', followedUsers)
                })
                // I don't want the connected users likes
                .andWhere('likes.user_id', '!=', userId),

              // Third QUERY
              db
                .select([
                  ...select,
                  'retweets.created_at',
                  db.raw('NULL'),
                  db.raw(
                    `concat (users.display_name,',', users.username) as retweet_author`
                  ),
                ])
                .from('tweets')
                .innerJoin('retweets', 'retweets.tweet_id', '=', 'tweets.id')
                .innerJoin('users', 'users.id', '=', 'retweets.user_id')
                .whereIn('tweets.id', function () {
                  this.select('rt.tweet_id')
                    .from('retweets as rt')
                    .whereIn('rt.user_id', followedUsers)
                })
                .andWhere('retweets.user_id', '!=', userId),
            ],
            // Put parenthesis between the queries (Knex option)
            // select * from ((select * from foo) union (select * from bar)) results
            true
          )
          .as('results')
      )
      // One thing to notice is the order will be by the different created_at Field
      // In the first query, I select the tweets.created_at
      // In the second query, I select the likes.created_at
      // In the third query, I select the retweets.created_at
      // I can then have the order by created_at that I want.
      .orderBy('created_at', 'desc')
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
      isLiked: results ? results.id === tweet.id && results.liked : false,
      isRetweeted: results
        ? results.id === tweet.id && results.retweeted
        : false,
      isBookmarked: results
        ? results.id === tweet.id && results.bookmarked
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
