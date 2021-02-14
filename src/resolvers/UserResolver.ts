import {
  Arg,
  Authorized,
  Ctx,
  FieldResolver,
  Query,
  Resolver,
  Root,
} from 'type-graphql'
import User from '../entities/User'
import { MyContext } from '../types/types'

@Resolver(() => User)
class UserResolver {
  @Query(() => User)
  @Authorized()
  async user(@Arg('username') username: string, @Ctx() ctx: MyContext) {
    const { db } = ctx

    const [user] = await db('users').where('username', username)
    return user
  }

  @FieldResolver()
  async followersCount(@Root() user: User, @Ctx() ctx: MyContext) {
    const {
      dataloaders: { followersCountDataloader },
    } = ctx

    const count = await followersCountDataloader.load(user.id)

    return count ? count.count : 0
  }

  @FieldResolver()
  async followingsCount(@Root() user: User, @Ctx() ctx: MyContext) {
    const {
      dataloaders: { followingsCountDataloader },
    } = ctx

    const count = await followingsCountDataloader.load(user.id)

    return count ? count.count : 0
  }
}

export default UserResolver
