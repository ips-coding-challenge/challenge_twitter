import { gql } from 'apollo-server'

export const FEED = gql`
  query {
    feed {
      id
      body
      visibility
      user {
        id
        username
        display_name
      }
    }
  }
`
