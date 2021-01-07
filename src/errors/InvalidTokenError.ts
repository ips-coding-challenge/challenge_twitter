import { ApolloError } from 'apollo-server'

export default class InvalidTokenError extends ApolloError {
  constructor() {
    super('Invalid token')
  }
}
