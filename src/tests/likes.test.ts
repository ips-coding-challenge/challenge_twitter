import db from '../db/connection'
import { generateToken } from '../utils/utils'
import { createLike, createTweet, createUser } from './helpers'
import { TOGGLE_LIKE } from './queries/likes.queries'
import { ADD_TWEET, FEED, DELETE_TWEET } from './queries/tweets.queries'
import { testClient } from './setup'

describe('Likes', () => {
  beforeEach(async () => {
    await db.migrate.rollback()
    await db.migrate.latest()
  })

  afterEach(async () => {
    await db.migrate.rollback()
  })

  it('should add a like', async () => {
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
      mutation: TOGGLE_LIKE,
      variables: {
        tweet_id: tweet.id,
      },
    })

    const [like] = await db('likes').where({
      user_id: user.id,
      tweet_id: tweet.id,
    })

    expect(like).not.toBeUndefined()

    expect(res.data.toggleLike).toEqual('Like added')
    expect(res.errors).toBeUndefined()
  })

  it('should add delete a like', async () => {
    const user = await createUser()
    const tweet = await createTweet(user)
    await createLike(user, tweet)

    const { mutate } = await testClient({
      req: {
        headers: {
          authorization: 'Bearer ' + generateToken(user),
        },
      },
    })

    const res = await mutate({
      mutation: TOGGLE_LIKE,
      variables: {
        tweet_id: tweet.id,
      },
    })

    const [deleted] = await db('likes').where({
      user_id: user.id,
      tweet_id: tweet.id,
    })

    expect(deleted).toBeUndefined()

    expect(res.data.toggleLike).toEqual('Like deleted')
    expect(res.errors).toBeUndefined()
  })

  it('should not authorized an anonymous user to like a tweet', async () => {
    const user = await createUser()
    const tweet = await createTweet(user)

    const { mutate } = await testClient()

    const res = await mutate({
      mutation: TOGGLE_LIKE,
      variables: {
        tweet_id: tweet.id,
      },
    })

    const likes = await db('likes')
    expect(likes.length).toEqual(0)

    expect(res.errors![0].message).toEqual('Unauthorized')
  })

  it('should not authorized an anonymous user to delete a like', async () => {
    const user = await createUser()
    const tweet = await createTweet(user)
    const like = await createLike(user, tweet)

    const { mutate } = await testClient()

    const res = await mutate({
      mutation: TOGGLE_LIKE,
      variables: {
        tweet_id: tweet.id,
      },
    })

    const likes = await db('likes')
    expect(likes.length).toEqual(1)

    expect(res.errors![0].message).toEqual('Unauthorized')
  })
})
