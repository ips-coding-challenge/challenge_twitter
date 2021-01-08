import 'reflect-metadata'
import { ApolloServer } from 'apollo-server'
import { buildSchema } from 'type-graphql'
import AuthResolver from './resolvers/AuthResolver'
import db from './db/connection'
import { authChecker } from './middlewares/authChecker'

export const defaultContext = ({ req, res }: any) => {
  return {
    req,
    res,
    db,
  }
}

export const schema = async () => {
  return await buildSchema({
    resolvers: [AuthResolver],
    authChecker: authChecker,
  })
}

const createServer = async () => {
  return new ApolloServer({
    schema: await schema(),
    context: defaultContext,
  })
}

export default createServer
