import { Field, ObjectType } from 'type-graphql'

@ObjectType()
class TweetUserInfos {
  @Field({ nullable: true })
  isLiked?: boolean

  @Field({ nullable: true })
  isRetweeted?: boolean

  @Field({ nullable: true })
  isBookmarked?: boolean
}

export default TweetUserInfos
