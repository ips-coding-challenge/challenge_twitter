import { ApolloError } from 'apollo-server'
import { Arg, Authorized, Ctx, Mutation, Resolver } from 'type-graphql'
import { MyContext } from '../types/types'

@Resolver()
class LikeResolver {
  @Mutation(() => String)
  @Authorized()
  async toggleLike(@Arg('tweet_id') tweet_id: number, @Ctx() ctx: MyContext) {
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
      const [alreadyLiked] = await db('likes').where(data)

      if (alreadyLiked) {
        // Delete the like and return
        await db('likes').where(data).del()

        return 'Like deleted'
      }

      await db('likes').insert(data)

      return 'Like added'
    } catch (e) {
      throw new ApolloError(e.message)
    }
  }
}
export default LikeResolver
