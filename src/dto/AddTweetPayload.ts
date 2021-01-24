import {
  IsDefined,
  IsIn,
  IsNotEmpty,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator'
import { Field, InputType, Int } from 'type-graphql'
import { TweetTypeEnum } from '../entities/Tweet'

@InputType()
class AddTweetPayload {
  @Field()
  @IsNotEmpty()
  @MinLength(2)
  body: string

  @Field(() => [String], { nullable: true })
  @Matches(/^#[\w]{2,20}$/, {
    each: true,
    message:
      'Each hashtag should start with a # and have a length betweet 2 and 20 characters',
  })
  hashTags?: string[]

  @Field({ nullable: true })
  url?: string

  @Field(() => Int, { nullable: true })
  @ValidateIf((o) => o.type !== undefined)
  @IsDefined()
  parent_id?: number

  @Field(() => String, { nullable: true })
  @ValidateIf((o) => o.parent_id !== undefined)
  @IsDefined()
  @IsIn([TweetTypeEnum.COMMENT, TweetTypeEnum.RETWEET])
  type?: TweetTypeEnum

  @Field(() => String, { nullable: true })
  visibility?: string
}

export default AddTweetPayload
