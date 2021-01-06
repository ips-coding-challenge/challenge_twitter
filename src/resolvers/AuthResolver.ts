import {
  Arg,
  Ctx,
  Field,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from 'type-graphql'
import RegisterPayload from '../dto/RegisterPayload'
import User from '../entities/User'
import { MyContext } from '../types/types'
import { generateToken } from '../utils/utils'
import argon2 from 'argon2'
import LoginPayload from '../dto/LoginPayload'
import { ApolloError } from 'apollo-server'

@ObjectType()
class AuthResponse {
  @Field()
  token: string

  @Field(() => User)
  user: User
}

@Resolver()
class AuthResolver {
  @Query(() => String)
  me() {
    return 'Hello'
  }

  @Mutation(() => AuthResponse)
  async register(@Arg('input') input: RegisterPayload, @Ctx() ctx: MyContext) {
    const { db } = ctx

    const hash = await argon2.hash(input.password)

    const [user] = await db('users')
      .insert({
        ...input,
        password: hash,
      })
      .returning('*')

    const token = generateToken(user)

    return { token, user }
  }

  @Mutation(() => AuthResponse)
  async login(@Arg('input') input: LoginPayload, @Ctx() ctx: MyContext) {
    const { db } = ctx

    const [user] = await db('users').where('email', input.email)

    if (!user) {
      throw new ApolloError('Invalid credentials')
    }

    const isPasswordValid = await argon2.verify(user.password, input.password)

    if (!isPasswordValid) {
      throw new ApolloError('Invalid credentials')
    }

    const token = generateToken(user)

    return { token, user }
  }
}

export default AuthResolver
