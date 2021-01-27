import { gql } from 'apollo-server'

export const TOGGLE_RETWEET = gql`
  mutation($tweet_id: Float!) {
    toggleRetweet(tweet_id: $tweet_id)
  }
`
