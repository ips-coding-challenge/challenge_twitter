import { ApolloError } from 'apollo-server'
import { Arg, Authorized, Ctx, Mutation, Resolver } from 'type-graphql'
import { MyContext } from '../types/types'

@Resolver()
class FollowerResolver {
  @Mutation(() => String)
  @Authorized()
  async toggleFollow(
    @Arg('following_id') following_id: number,
    @Ctx() ctx: MyContext
  ) {
    const { db, userId } = ctx

    try {
      const userToFollow = await db('users').where('id', following_id)

      if (!userToFollow) {
        throw new ApolloError('User not found')
      }

      const [alreadyFollow] = await db('followers').where({
        follower_id: userId,
        following_id,
      })

      // Delete the follow
      if (alreadyFollow) {
        await db('followers')
          .where({
            follower_id: userId,
            following_id,
          })
          .del()

        return 'You are no longer following this user'
      }

      await db('followers').insert({
        follower_id: userId,
        following_id,
      })

      return 'User followed!'
    } catch (e) {
      console.log('e', e)
      throw e
    }
  }
}

export default FollowerResolver
