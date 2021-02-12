import db from '../db/connection'
import { generateToken } from '../utils/utils'
import {
  createLike,
  createRetweet,
  createTweet,
  createUser,
  followUser,
} from './helpers'
import { testClient } from './setup'
import { TOGGLE_FOLLOW } from './queries/followers.queries'
import { FEED } from './queries/tweets.queries'

describe('Feed', () => {
  beforeEach(async () => {
    await db.migrate.rollback()
    await db.migrate.latest()
  })

  afterEach(async () => {
    await db.migrate.rollback()
  })

  it('should fetch the connected user tweets, comments', async () => {
    const user = await createUser()
    const tweet = await createTweet(user, 'First tweet', 'tweet')
    const secondTweet = await createTweet(user, 'Second tweet', 'comment')

    const { query } = await testClient({
      req: {
        headers: {
          authorization: 'Bearer ' + generateToken(user),
        },
      },
    })

    const res = await query({
      query: FEED,
    })

    expect(res.data).not.toBeNull()
    expect(res.data.feed.length).toEqual(2)
  })

  it('should not fetch the connected user likes and retweets', async () => {
    const user = await createUser()
    const secondUser = await createUser('second', 'second@test.fr', 'Second')
    const tweet = await createTweet(user, 'First tweet', 'tweet')
    const secondTweet = await createTweet(secondUser, 'Second tweet', 'tweet')
    const thirdTweet = await createTweet(secondUser, 'Third tweet', 'tweet')
    const like = await createLike(user, secondTweet)
    const retweet = await createRetweet(user, thirdTweet)

    const { query } = await testClient({
      req: {
        headers: {
          authorization: 'Bearer ' + generateToken(user),
        },
      },
    })

    const res = await query({
      query: FEED,
    })

    expect(res.data).not.toBeNull()
    expect(res.data.feed.length).toEqual(1)
    expect(
      res.data.feed.find((t: any) => t.id === like.tweet_id)
    ).toBeUndefined()
    expect(
      res.data.feed.find((t: any) => t.id === retweet.tweet_id)
    ).toBeUndefined()
  })

  it('should fetch the followed user tweets', async () => {
    const user = await createUser()
    const secondUser = await createUser('second', 'second@test.fr', 'Second')
    await followUser(user, secondUser)
    const tweet = await createTweet(secondUser, 'First tweet', 'tweet')
    const anotherTweet = await createTweet(user, 'Another tweet', 'comment')
    const like = await createLike(secondUser, anotherTweet)

    const { query } = await testClient({
      req: {
        headers: {
          authorization: 'Bearer ' + generateToken(user),
        },
      },
    })

    const res = await query({
      query: FEED,
    })

    expect(res.data).not.toBeNull()
    expect(res.data.feed.length).toEqual(3)
  })

  it('should not fetch the like if a followed user likes and retweets the same tweet', async () => {
    const user = await createUser()
    const secondUser = await createUser('second', 'second@test.fr', 'Second')
    const thirdUser = await createUser('third', 'third@test.fr', 'Third')
    await followUser(user, secondUser)
    const tweet = await createTweet(secondUser, 'First tweet', 'tweet')
    const secondTweet = await createTweet(thirdUser, 'Second tweet', 'tweet')
    const like = await createLike(secondUser, secondTweet)
    const retweet = await createRetweet(secondUser, secondTweet)

    const { query } = await testClient({
      req: {
        headers: {
          authorization: 'Bearer ' + generateToken(user),
        },
      },
    })

    const res = await query({
      query: FEED,
    })

    // console.log('res.data', res.data)

    expect(res.data).not.toBeNull()
    expect(res.data.feed.length).toEqual(2)
  })
})
