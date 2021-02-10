import db from '../db/connection'
import FollowerRepository from './FollowerRepository'
import TweetRepository from './TweetRepository'

export default {
  tweetRepository: new TweetRepository(db),
  followerRepository: new FollowerRepository(db),
}
