import 'reflect-metadata'
import { ApolloServer } from 'apollo-server'
import { buildSchema } from 'type-graphql'
import AuthResolver from './resolvers/AuthResolver'
import db from './db/connection'
import { authChecker } from './middlewares/authChecker'
import TweetResolver from './resolvers/TweetResolver'
import { dataloaders } from './dataloaders/dataloaders'
import LikeResolver from './resolvers/LikeResolver'
import FollowerResolver from './resolvers/FollowerResolver'

export const defaultContext = ({ req, res }: any) => {
  return {
    req,
    res,
    db,
    dataloaders,
  }
}

export const schema = async () => {
  return await buildSchema({
    resolvers: [AuthResolver, TweetResolver, LikeResolver, FollowerResolver],
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
