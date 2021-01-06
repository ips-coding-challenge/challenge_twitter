import 'reflect-metadata'
import { ApolloServer } from 'apollo-server'
import { buildSchema } from 'type-graphql'
import AuthResolver from './resolvers/AuthResolver'
import db from './db/connection'

const createServer = async () => {
  return new ApolloServer({
    schema: await buildSchema({
      resolvers: [AuthResolver],
    }),
    context: ({ req, res }) => {
      return {
        req,
        res,
        db,
      }
    },
  })
}

export default createServer
