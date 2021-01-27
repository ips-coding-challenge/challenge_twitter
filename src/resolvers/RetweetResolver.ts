import { ApolloError } from 'apollo-server'
import { Arg, Authorized, Ctx, Mutation, Resolver } from 'type-graphql'
import { MyContext } from '../types/types'

@Resolver()
class RetweetResolver {
  @Mutation(() => String)
  @Authorized()
  async toggleRetweet(
    @Arg('tweet_id') tweet_id: number,
    @Ctx() ctx: MyContext
  ) {
    const { db, userId } = ctx

    const [tweet] = await db('tweets').where('id', tweet_id)

    if (!tweet) {
      throw new ApolloError('Tweet not found')
    }

    const data = {
      user_id: userId,
      tweet_id: tweet_id,
    }

    try {
      const [alreadyRetweeted] = await db('retweets').where(data)

      if (alreadyRetweeted) {
        // Delete the like and return
        await db('retweets').where(data).del()

        return 'Retweet deleted'
      }

      await db('retweets').insert(data)

      return 'Retweet added'
    } catch (e) {
      throw new ApolloError(e.message)
    }
  }
}
export default RetweetResolver
