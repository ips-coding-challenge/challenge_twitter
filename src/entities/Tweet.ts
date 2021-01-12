import { Field, ID, Int, ObjectType } from 'type-graphql'
import User from './User'

@ObjectType()
class Tweet {
  @Field()
  id: number

  @Field()
  body: string

  @Field()
  visibility: string

  @Field()
  type: string

  @Field()
  user: User

  user_id: number

  @Field()
  likesCount: number

  @Field()
  isLiked: boolean

  @Field()
  created_at: Date

  @Field()
  updated_at: Date
}

export default Tweet
