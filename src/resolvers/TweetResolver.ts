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

    const tweets = await db('tweets').orderBy('id', 'desc').limit(50)

    return tweets
  }

  @FieldResolver(() => User)
  async user(@Root() tweet: Tweet, @Ctx() ctx: MyContext) {
    const {
      dataloaders: { userDataloader },
    } = ctx

    return await userDataloader.load(tweet.user_id)
  }

  @FieldResolver(() => Int)
  async likesCount(@Root() tweet: Tweet, @Ctx() ctx: MyContext) {
    const {
      dataloaders: { likesCountDataloader },
    } = ctx
    const count = await likesCountDataloader.load(tweet.id)
    return count?.likesCount || 0
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
