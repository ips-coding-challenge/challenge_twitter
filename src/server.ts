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
import scrapPreviewEmitter from './events/scrapPreviewEmitter'
import RetweetResolver from './resolvers/RetweetResolver'
import BookmarkResolver from './resolvers/BookmarkResolver'

export const defaultContext = ({ req, res }: any) => {
  return {
    req,
    res,
    db,
    dataloaders,
    bus: scrapPreviewEmitter,
  }
}

export const schema = async () => {
  return await buildSchema({
    resolvers: [
      AuthResolver,
      TweetResolver,
      LikeResolver,
      FollowerResolver,
      RetweetResolver,
      BookmarkResolver,
    ],
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
