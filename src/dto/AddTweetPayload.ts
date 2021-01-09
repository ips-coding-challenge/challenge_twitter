import { IsEmail, IsNotEmpty, MinLength } from 'class-validator'
import { Field, InputType, Int } from 'type-graphql'

@InputType()
class AddTweetPayload {
  @Field()
  @IsNotEmpty()
  @MinLength(2)
  body: string

  @Field(() => Int, { nullable: true })
  parent_id?: number

  @Field(() => String, { nullable: true })
  type?: string

  @Field(() => String, { nullable: true })
  visibility?: string
}

export default AddTweetPayload
