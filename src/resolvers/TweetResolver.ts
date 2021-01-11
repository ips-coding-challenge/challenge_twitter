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
import Tweet from '../entities/Tweet'
import User from '../entities/User'
import { MyContext } from '../types/types'

@Resolver((of) => Tweet)
class TweetResolver {
  @Query(() => [Tweet])
  async feed(@Ctx() ctx: MyContext) {
    const { db } = ctx

    const tweets = await db('tweets')
      .select([
        'tweets.*',
        db.raw(
          '(select count(tweet_id) from likes where tweet_id = tweets.id) as likes_count'
        ),
      ])
      .orderBy('id', 'desc')
      .limit(20)

    return tweets
  }

  @FieldResolver(() => User)
  async user(@Root() tweet: Tweet, @Ctx() ctx: MyContext) {
    const {
      dataloaders: { userDataloader },
    } = ctx

    return await userDataloader.load(tweet.user_id)
  }

  // @FieldResolver(() => Int)
  // async likesCount(@Root() tweet: Tweet, @Ctx() ctx: MyContext) {
  //   const {
  //     dataloaders: { likesCountDataloader },
  //   } = ctx
  //   const count = await likesCountDataloader.load(tweet.id)
  //   return count?.likesCount || 0
  // }

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
    const { db, userId } = ctx

    try {
      const [tweet] = await db('tweets')
        .insert({
          ...payload,
          user_id: userId,
        })
        .returning('*')

      return tweet
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
