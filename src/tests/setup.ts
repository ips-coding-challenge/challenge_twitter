import { ApolloServer } from 'apollo-server'
import { createTestClient } from 'apollo-server-testing'
import { defaultContext, schema } from '../server'

export const testClient = async (ctxArg: any = { req: { headers: {} } }) => {
  return createTestClient(
    new ApolloServer({
      schema: await schema(),
      context: () => defaultContext(ctxArg),
    })
  )
}
