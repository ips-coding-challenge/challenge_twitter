import { Ctx, Query, Resolver } from 'type-graphql'
import { MyContext } from '../types/types'

@Resolver()
class AuthResolver {
  @Query(() => String)
  async me(@Ctx() ctx: MyContext) {
    return 'Hello'
  }
}

export default AuthResolver
