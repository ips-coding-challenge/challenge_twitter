import { Field, ObjectType } from 'type-graphql'

@ObjectType()
class Hashtag {
  @Field()
  id: number

  @Field()
  hashtag: string

  @Field({ nullable: true })
  tweetsCount?: number
}

export default Hashtag
