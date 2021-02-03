import { Field, ObjectType } from 'type-graphql'

@ObjectType()
class Media {
  @Field()
  id: number

  @Field()
  url: string

  user_id: number

  tweet_id: number
}

export default Media
