import db from '../db/connection'
import { generateToken } from '../utils/utils'
import {
  createBookmark,
  createLike,
  createRetweet,
  createTweet,
  createUser,
} from './helpers'
import { TOGGLE_BOOKMARK } from './queries/bookmarks.queries'
import { TOGGLE_LIKE } from './queries/likes.queries'
import { TOGGLE_RETWEET } from './queries/retweets.queries'
import { ADD_TWEET, FEED, DELETE_TWEET } from './queries/tweets.queries'
import { testClient } from './setup'

describe('Bookmarks', () => {
  beforeEach(async () => {
    await db.migrate.rollback()
    await db.migrate.latest()
  })

  afterEach(async () => {
    await db.migrate.rollback()
  })

  it('should add a bookmark', async () => {
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
      mutation: TOGGLE_BOOKMARK,
      variables: {
        tweet_id: tweet.id,
      },
    })

    const [bookmark] = await db('bookmarks').where({
      user_id: user.id,
      tweet_id: tweet.id,
    })

    expect(bookmark).not.toBeUndefined()

    expect(res.data.toggleBookmark).toEqual('Bookmark added')
    expect(res.errors).toBeUndefined()
  })

  it('should delete a bookmark', async () => {
    const user = await createUser()
    const tweet = await createTweet(user)
    await createBookmark(user, tweet)

    const { mutate } = await testClient({
      req: {
        headers: {
          authorization: 'Bearer ' + generateToken(user),
        },
      },
    })

    const res = await mutate({
      mutation: TOGGLE_BOOKMARK,
      variables: {
        tweet_id: tweet.id,
      },
    })

    const [deleted] = await db('bookmarks').where({
      user_id: user.id,
      tweet_id: tweet.id,
    })

    expect(deleted).toBeUndefined()

    expect(res.data.toggleBookmark).toEqual('Bookmark deleted')
    expect(res.errors).toBeUndefined()
  })

  it('should not authorized an anonymous user to bookmark a tweet', async () => {
    const user = await createUser()
    const tweet = await createTweet(user)

    const { mutate } = await testClient()

    const res = await mutate({
      mutation: TOGGLE_BOOKMARK,
      variables: {
        tweet_id: tweet.id,
      },
    })

    const bookmarks = await db('bookmarks')
    expect(bookmarks.length).toEqual(0)

    expect(res.errors![0].message).toEqual('Unauthorized')
  })

  it('should not authorized an anonymous user to delete a bookmark', async () => {
    const user = await createUser()
    const tweet = await createTweet(user)
    await createBookmark(user, tweet)

    const { mutate } = await testClient()

    const res = await mutate({
      mutation: TOGGLE_BOOKMARK,
      variables: {
        tweet_id: tweet.id,
      },
    })

    const bookmarks = await db('bookmarks')
    expect(bookmarks.length).toEqual(1)

    expect(res.errors![0].message).toEqual('Unauthorized')
  })
})
