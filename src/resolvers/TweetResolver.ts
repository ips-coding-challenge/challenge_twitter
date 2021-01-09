import {
  Arg,
  Authorized,
  Ctx,
  FieldResolver,
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

  @Mutation(() => Tweet)
  @Authorized()
  async addTweet(
    @Arg('payload') payload: AddTweetPayload,
    @Ctx() ctx: MyContext
  ) {
    const { db, userId } = ctx

    const [tweet] = await db('tweets')
      .insert({
        ...payload,
        user_id: userId,
      })
      .returning('*')

    return tweet
  }
}

export default TweetResolver
