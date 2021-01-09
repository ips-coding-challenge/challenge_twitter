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

export const ADD_TWEET = gql`
  mutation($payload: AddTweetPayload!) {
    addTweet(payload: $payload) {
      id
      body
      user {
        id
        username
      }
    }
  }
`
