import { Field, ID, Int, ObjectType } from 'type-graphql'

@ObjectType()
class User {
  @Field()
  id: number

  @Field()
  username: string

  @Field()
  display_name: string

  @Field()
  email: string

  password: string

  @Field({ nullable: true })
  avatar?: string

  @Field({ nullable: true })
  bio?: string

  @Field({ nullable: true })
  banner?: string

  @Field()
  created_at: Date

  @Field()
  updated_at: Date
}

export default User
