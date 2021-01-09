import db from '../db/connection'
import { generateToken } from '../utils/utils'
import { createTweet, createUser } from './helpers'
import { ADD_TWEET, FEED } from './queries/tweets.queries'
import { testClient } from './setup'

describe('Tweets', () => {
  beforeEach(async () => {
    await db.migrate.rollback()
    await db.migrate.latest()
  })

  afterEach(async () => {
    await db.migrate.rollback()
  })

  test('it should fetch the tweets with user', async () => {
    const user = await createUser()
    const tweet = await createTweet(user, 'First tweet')

    const { query } = await testClient()

    const res = await query({
      query: FEED,
    })

    expect(res.data.feed.length).toEqual(1)
    expect(res.data.feed[0].body).toEqual('First tweet')
  })

  test('it should insert a tweet', async () => {
    const user = await createUser()

    const { mutate } = await testClient({
      req: {
        headers: { authorization: 'Bearer ' + generateToken(user) },
      },
    })

    const res = await mutate({
      mutation: ADD_TWEET,
      variables: {
        payload: { body: 'First tweet' },
      },
    })

    const newTweet = await db('tweets')

    expect(newTweet.length).toEqual(1)

    expect(res.data.addTweet).not.toBeNull()
    expect(res.data.addTweet.body).toEqual('First tweet')
    expect(res.data.addTweet.user.id).toEqual(user.id)
  })

  test('it should not insert if the user is not authenticated', async () => {
    const { mutate } = await testClient()

    const res = await mutate({
      mutation: ADD_TWEET,
      variables: {
        payload: { body: 'First tweet' },
      },
    })

    const newTweet = await db('tweets')

    expect(newTweet.length).toEqual(0)

    expect(res.data).toBeNull()
    expect(res.errors![0].message).toEqual('Unauthorized')
  })

  test('it should not insert a tweet if the body is empty', async () => {
    const user = await createUser()

    const { mutate } = await testClient({
      req: {
        headers: { authorization: 'Bearer ' + generateToken(user) },
      },
    })

    const res = await mutate({
      mutation: ADD_TWEET,
      variables: {
        payload: { body: '' },
      },
    })

    const newTweet = await db('tweets')

    expect(newTweet.length).toEqual(0)

    expect(res.errors).not.toBeNull()
    expect(res.errors![0].message).toEqual('Argument Validation Error')
  })
})
