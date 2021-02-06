import { ApolloError } from 'apollo-server'
import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import User from '../entities/User'
import { MyContext } from '../types/types'

@Resolver()
class FollowerResolver {
  @Query(() => [User])
  @Authorized()
  async followersSuggestions(@Ctx() ctx: MyContext) {
    const { db, userId } = ctx

    const followersIds = await db('followers')
      .where('follower_id', userId)
      .pluck('following_id')

    const followersSuggestions = await db('users')
      .select(
        db.raw(
          `(SELECT count(id) from followers f WHERE f.following_id = users.id ) as "followersCount"`
        ),
        'users.*'
      )
      .whereNotIn('id', [...followersIds, userId])
      .orderBy('followersCount', 'desc')
      // .orderByRaw('random()') // Look for TABLESAMPLE for better performance
      .limit(2)

    return followersSuggestions
  }

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
