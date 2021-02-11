import { Arg, Ctx, Query, Resolver } from 'type-graphql'
import User from '../entities/User'
import { MyContext } from '../types/types'

@Resolver(() => User)
class UserResolver {
  @Query(() => User)
  async user(@Arg('username') username: string, @Ctx() ctx: MyContext) {
    const { db } = ctx

    const [user] = await db('users').where('username', username)
    return user
  }
}

export default UserResolver
