import { gql } from 'apollo-server'

export const FEED = gql`
  query {
    feed {
      id
      body
      visibility
      likesCount
      commentsCount
      retweetsCount
      likeAuthor {
        username
        display_name
      }
      retweetAuthor {
        username
        display_name
      }
      user {
        id
        username
        display_name
      }
    }
  }
`

export const TWEETS = gql`
  query($user_id: Float!, $limit: Int, $offset: Int, $filter: Filters) {
    tweets(user_id: $user_id, limit: $limit, offset: $offset, filter: $filter) {
      id
      body
      visibility
      likesCount
      commentsCount
      retweetsCount
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
      media {
        id
        url
      }
    }
  }
`
export const DELETE_TWEET = gql`
  mutation($id: Float!) {
    deleteTweet(id: $id)
  }
`
