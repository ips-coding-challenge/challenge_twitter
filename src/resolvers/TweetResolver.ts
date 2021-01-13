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
import Tweet, { TweetTypeEnum } from '../entities/Tweet'
import User from '../entities/User'
import { MyContext } from '../types/types'

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

  @FieldResolver(() => Int)
  async likesCount(@Root() tweet: Tweet, @Ctx() ctx: MyContext) {
    const {
      dataloaders: { likesCountDataloader },
    } = ctx
    const count = await likesCountDataloader.load(tweet.id)
    return count?.likesCount || 0
  }

  @FieldResolver(() => Int)
  async retweetsCount(@Root() tweet: Tweet, @Ctx() ctx: MyContext) {
    const {
      dataloaders: { retweetsCountDataloader },
    } = ctx
    const count = await retweetsCountDataloader.load(tweet.id)
    return count?.retweetsCount || 0
  }

  @FieldResolver(() => Int)
  async commentsCount(@Root() tweet: Tweet, @Ctx() ctx: MyContext) {
    const {
      dataloaders: { commentsCountDataloader },
    } = ctx
    const count = await commentsCountDataloader.load(tweet.id)
    return count?.commentsCount || 0
  }

  @FieldResolver(() => Boolean)
  @Authorized('ANONYMOUS')
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

  @Mutation(() => Tweet)
  @Authorized()
  async addTweet(
    @Arg('payload') payload: AddTweetPayload,
    @Ctx() ctx: MyContext
  ) {
    const {
      db,
      userId,
      dataloaders: { retweetsCountDataloader, commentsCountDataloader },
    } = ctx
    const { body, type, parent_id } = payload

    // Maybe I should add a mutation to handle the retweet?
    // For the comment, we can comment as much as we want so I could
    // still add the comment here.
    // Feel free to share your opinion ;)
    if (type === TweetTypeEnum.RETWEET && parent_id) {
      const [alreadyRetweeted] = await db('tweets').where({
        parent_id: parent_id,
        type: TweetTypeEnum.RETWEET,
        user_id: userId,
      })

      if (alreadyRetweeted) {
        throw new ApolloError('You already retweeted that tweet')
      }
    }

    if (parent_id) {
      const [tweetExists] = await db('tweets').where('id', parent_id)
      if (!tweetExists) {
        throw new ApolloError('Tweet not found')
      }
    }

    try {
      const [tweet] = await db('tweets')
        .insert({
          ...payload,
          user_id: userId,
        })
        .returning('*')

      if (type === TweetTypeEnum.RETWEET) {
        retweetsCountDataloader.clear(tweet.parent_id)
      } else if (type === TweetTypeEnum.COMMENT) {
        commentsCountDataloader.clear(tweet.parent_id)
      }

      return tweet
    } catch (e) {
      throw new ApolloError(e.message)
    }
  }

  @Mutation(() => Int)
  @Authorized()
  async deleteTweet(@Arg('id') id: number, @Ctx() ctx: MyContext) {
    const {
      db,
      userId,
      dataloaders: { retweetsCountDataloader, commentsCountDataloader },
    } = ctx

    try {
      const [tweet] = await db('tweets').where({
        id,
        user_id: userId,
      })

      if (!tweet) {
        throw new ApolloError('Tweet not found')
      }

      if (tweet.parent_id) {
        if (tweet.type === TweetTypeEnum.COMMENT) {
          commentsCountDataloader.clear(tweet.parent_id)
        } else if (tweet.type === TweetTypeEnum.RETWEET) {
          retweetsCountDataloader.clear(tweet.parent_id)
        }
      }

      // Return the number of affected rows
      return await db('tweets').where({ id, user_id: userId }).del()
    } catch (e) {
      throw new ApolloError(e.message)
    }
  }
}

export default TweetResolver
