import { Field, ID, Int, ObjectType } from 'type-graphql'
import Preview from './Preview'
import User from './User'

export enum TweetTypeEnum {
  TWEET = 'tweet',
  RETWEET = 'retweet',
  COMMENT = 'comment',
}

export enum TweetVisibilityEnum {
  PUBLIC = 'public',
  FOLLOWERS = 'followers',
}

@ObjectType()
class Tweet {
  @Field()
  id: number

  @Field()
  body: string

  @Field()
  visibility: TweetVisibilityEnum

  @Field(() => Tweet, { nullable: true })
  parent?: Tweet

  @Field({ nullable: true })
  parent_id?: number

  @Field()
  type: TweetTypeEnum

  @Field()
  user: User

  user_id: number

  @Field()
  retweetsCount: number

  @Field()
  commentsCount: number

  @Field()
  likesCount: number

  @Field()
  bookmarksCount: number

  @Field()
  isLiked: boolean

  @Field()
  isRetweeted: boolean

  @Field()
  isBookmarked: boolean

  @Field({ nullable: true })
  preview?: Preview

  @Field()
  created_at: Date

  @Field()
  updated_at: Date
}

export default Tweet
