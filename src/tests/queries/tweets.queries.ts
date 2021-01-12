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
      type
      parent_id
      user {
        id
        username
      }
    }
  }
`
export const DELETE_TWEET = gql`
  mutation($id: Float!) {
    deleteTweet(id: $id)
  }
`
