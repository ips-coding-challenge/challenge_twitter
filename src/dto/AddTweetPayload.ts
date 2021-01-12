import { IsIn, IsNotEmpty, MinLength, ValidateIf } from 'class-validator'
import { Field, InputType, Int } from 'type-graphql'
import { TweetTypeEnum } from '../entities/Tweet'

@InputType()
class AddTweetPayload {
  @Field()
  @IsNotEmpty()
  @MinLength(2)
  body: string

  @Field(() => Int, { nullable: true })
  @ValidateIf((o) => o.type !== undefined)
  @IsNotEmpty()
  parent_id?: number

  @Field(() => String, { nullable: true })
  @ValidateIf((o) => o.parent_id !== undefined)
  @IsIn([TweetTypeEnum.COMMENT, TweetTypeEnum.RETWEET])
  type?: TweetTypeEnum

  @Field(() => String, { nullable: true })
  visibility?: string
}

export default AddTweetPayload
