import { IsEmail, IsNotEmpty } from 'class-validator'
import { Field, InputType } from 'type-graphql'

@InputType()
class LoginPayload {
  @Field()
  @IsEmail()
  email: string

  @Field()
  @IsNotEmpty()
  password: string
}

export default LoginPayload
