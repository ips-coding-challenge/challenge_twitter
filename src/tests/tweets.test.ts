import db from '../db/connection'
import { generateToken } from '../utils/utils'
import { createTweet, createUser } from './helpers'
import { ADD_TWEET, FEED, DELETE_TWEET } from './queries/tweets.queries'
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

    console.log('res', res)

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

  it('should delete a user s tweet', async () => {
    const user = await createUser()
    const tweet = await createTweet(user, 'First tweet')

    const { mutate } = await testClient({
      req: {
        headers: { authorization: 'Bearer ' + generateToken(user) },
      },
    })

    const res = await mutate({
      mutation: DELETE_TWEET,
      variables: {
        id: tweet.id,
      },
    })

    const [deletedTweet] = await db('tweets').where({
      id: tweet.id,
      user_id: user.id,
    })

    expect(deletedTweet).toBeUndefined()

    expect(res.data.deleteTweet).toEqual(1)
  })

  it('should not delete a tweet that doesnt belong to the connected user', async () => {
    const user = await createUser()
    const another = await createUser('another', 'another@test.fr')
    const tweet = await createTweet(user, 'First tweet')

    const { mutate } = await testClient({
      req: {
        headers: { authorization: 'Bearer ' + generateToken(another) },
      },
    })

    const res = await mutate({
      mutation: DELETE_TWEET,
      variables: {
        id: tweet.id,
      },
    })

    const [deletedTweet] = await db('tweets').where({
      id: tweet.id,
      user_id: user.id,
    })

    expect(deletedTweet).not.toBeUndefined()
    expect(res.errors).not.toBeNull()
    expect(res.errors![0].message).toEqual('Tweet not found')
  })

  it('should insert a comment', async () => {
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
      mutation: ADD_TWEET,
      variables: {
        payload: {
          body: 'Bouh',
          type: 'comment',
          parent_id: tweet.id,
        },
      },
    })

    console.log('res', res.data)

    const tweets = await db('tweets')

    expect(tweets.length).toEqual(2)

    expect(res.data.addTweet.body).toEqual('Bouh')
    expect(res.data.addTweet.type).toEqual('comment')
    expect(res.data.addTweet.parent_id).toEqual(tweet.id)
    expect(res.errors).toBeUndefined()
  })
  // it('should insert a retweet', async () => {})
  // it('should not insert a comment if not parent_id is provided', async () => {})
  // it('should not insert a comment if the type is not provided', async () => {})
  // it('should not insert a retweet if not parent_id is provided', async () => {})
  // it('should not insert a retweet if the type is not provided', async () => {})
  // it('should not insert a retweet if the user already retweeted the tweet', async () => {})
})
