import { gql } from 'apollo-server'

export const TOGGLE_LIKE = gql`
  mutation($tweet_id: Float!) {
    toggleLike(tweet_id: $tweet_id)
  }
`
