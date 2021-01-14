import { IsEmail, Matches, MinLength } from 'class-validator'
import { Field, InputType } from 'type-graphql'
import { Unique } from '../validators/Unique'

@InputType()
class RegisterPayload {
  @Field()
  @Matches(/^[\w]{2,30}$/, {
    message:
      'The username should only contains alphanumeric characters, underscores and should have a length between 2 to 30',
  })
  @Unique('users', { message: 'This username is already taken' })
  username: string

  @Field()
  @Matches(/^[\w\s]{2,30}$/, {
    message:
      'The display name should only contains alphanumeric characters, spaces, underscores and should have a length between 2 to 30',
  })
  display_name: string

  @Field()
  @IsEmail()
  @Unique('users', { message: 'This email is already taken' })
  email: string

  @Field()
  @MinLength(6)
  password: string
}

export default RegisterPayload
