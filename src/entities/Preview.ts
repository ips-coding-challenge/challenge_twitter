import { Field, ObjectType } from 'type-graphql'

@ObjectType()
class Preview {
  @Field()
  id: number

  @Field()
  url: string

  @Field()
  title: string

  @Field({ nullable: true })
  description?: string

  @Field({ nullable: true })
  image?: string
}

export default Preview
