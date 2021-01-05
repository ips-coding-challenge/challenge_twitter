import 'reflect-metadata'
import { ApolloServer } from 'apollo-server'
import { buildSchema } from 'type-graphql'
import AuthResolver from './resolvers/AuthResolver'
import dotenv from 'dotenv'
import path from 'path'
import db from './db/connection'

dotenv.config({
  path: path.join(__dirname, `../.env.${process.env.NODE_ENV}`),
})

export const createServer = async () => {
  const server = new ApolloServer({
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

  server.listen().then(({ port }) => {
    console.log(`Listening on port ${port}`)
  })

  return server
}

createServer()
