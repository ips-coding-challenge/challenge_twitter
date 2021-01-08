import { Ctx, FieldResolver, Query, Resolver, Root } from 'type-graphql'
import Tweet from '../entities/Tweet'
import User from '../entities/User'
import { MyContext } from '../types/types'

@Resolver((of) => Tweet)
class TweetResolver {
  @Query(() => [Tweet])
  async feed(@Ctx() ctx: MyContext) {
    const { db } = ctx

    const tweets = await db('tweets').limit(50)

    return tweets
  }

  @FieldResolver(() => User)
  async user(@Root() tweet: Tweet, @Ctx() ctx: MyContext) {
    const {
      dataloaders: { userDataloader },
    } = ctx

    return await userDataloader.load(tweet.user_id)
  }
}

export default TweetResolver
