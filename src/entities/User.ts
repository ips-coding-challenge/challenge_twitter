import { Field, ID, ObjectType } from 'type-graphql'

@ObjectType()
class User {
  @Field((type) => ID)
  id: number

  @Field()
  username: string

  @Field()
  email: string

  password: string

  @Field()
  created_at: Date

  @Field()
  updated_at: Date
}

export default User
