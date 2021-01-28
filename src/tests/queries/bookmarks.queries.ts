import { gql } from 'apollo-server'

export const TOGGLE_BOOKMARK = gql`
  mutation($tweet_id: Float!) {
    toggleBookmark(tweet_id: $tweet_id)
  }
`
