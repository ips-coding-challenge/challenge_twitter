import db from '../db/connection'
import { generateToken } from '../utils/utils'
import { createLike, createRetweet, createTweet, createUser } from './helpers'
import { TOGGLE_LIKE } from './queries/likes.queries'
import { TOGGLE_RETWEET } from './queries/retweets.queries'
import { ADD_TWEET, FEED, DELETE_TWEET } from './queries/tweets.queries'
import { testClient } from './setup'

describe('Retweets', () => {
  beforeEach(async () => {
    await db.migrate.rollback()
    await db.migrate.latest()
  })

  afterEach(async () => {
    await db.migrate.rollback()
  })

  it('should add a retweet', async () => {
    const user = await createUser()
    const tweet = await createTweet(user)

    const { mutate } = await testClient({
      req: {
        headers: {
          authorization: 'Bearer ' + generateToken(user),
        },
      },
    })

    const res = await mutate({
      mutation: TOGGLE_RETWEET,
      variables: {
        tweet_id: tweet.id,
      },
    })

    const [retweet] = await db('retweets').where({
      user_id: user.id,
      tweet_id: tweet.id,
    })

    expect(retweet).not.toBeUndefined()

    expect(res.data.toggleRetweet).toEqual('Retweet added')
    expect(res.errors).toBeUndefined()
  })

  it('should add delete a retweet', async () => {
    const user = await createUser()
    const tweet = await createTweet(user)
    await createRetweet(user, tweet)

    const { mutate } = await testClient({
      req: {
        headers: {
          authorization: 'Bearer ' + generateToken(user),
        },
      },
    })

    const res = await mutate({
      mutation: TOGGLE_RETWEET,
      variables: {
        tweet_id: tweet.id,
      },
    })

    const [deleted] = await db('retweets').where({
      user_id: user.id,
      tweet_id: tweet.id,
    })

    expect(deleted).toBeUndefined()

    expect(res.data.toggleRetweet).toEqual('Retweet deleted')
    expect(res.errors).toBeUndefined()
  })

  it('should not authorized an anonymous user to retweet a tweet', async () => {
    const user = await createUser()
    const tweet = await createTweet(user)

    const { mutate } = await testClient()

    const res = await mutate({
      mutation: TOGGLE_RETWEET,
      variables: {
        tweet_id: tweet.id,
      },
    })

    const retweets = await db('retweets')
    expect(retweets.length).toEqual(0)

    expect(res.errors![0].message).toEqual('Unauthorized')
  })

  it('should not authorized an anonymous user to delete a retweet', async () => {
    const user = await createUser()
    const tweet = await createTweet(user)
    const retweet = await createRetweet(user, tweet)

    const { mutate } = await testClient()

    const res = await mutate({
      mutation: TOGGLE_RETWEET,
      variables: {
        tweet_id: tweet.id,
      },
    })

    const retweets = await db('retweets')
    expect(retweets.length).toEqual(1)

    expect(res.errors![0].message).toEqual('Unauthorized')
  })
})
