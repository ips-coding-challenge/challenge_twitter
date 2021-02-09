import { Field, ObjectType } from 'type-graphql'

@ObjectType()
class LikeRetweetAuthor {
  @Field()
  username: string

  @Field()
  display_name: string
}

export default LikeRetweetAuthor
