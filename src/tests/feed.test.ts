import db from '../db/connection'
import { generateToken } from '../utils/utils'
import {
  createLike,
  createMedia,
  createRetweet,
  createTweet,
  createUser,
  followUser,
} from './helpers'
import { testClient } from './setup'
import { TOGGLE_FOLLOW } from './queries/followers.queries'
import { FEED, TWEETS } from './queries/tweets.queries'

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

  // TEST TWEETS FROM A PARTICULAR USER
  it('should only fetch tweets and retweets from a user', async () => {
    const user = await createUser()
    const secondUser = await createUser('second', 'second@test.fr', 'Second')
    const tweet = await createTweet(user, 'First tweet', 'tweet')
    const secondTweet = await createTweet(secondUser, 'Second tweet', 'tweet')
    const comment = await createTweet(user, 'First comment', 'comment')
    const retweet = await createRetweet(user, secondTweet)

    const { query } = await testClient({
      req: {
        headers: {
          authorization: 'Bearer ' + generateToken(user),
        },
      },
    })

    const res = await query({
      query: TWEETS,
      variables: {
        user_id: user.id,
        filter: 'TWEETS_RETWEETS',
      },
    })

    expect(res.data.tweets).not.toBeNull()
    expect(res.data.tweets.length).toEqual(2)
  })

  it('should only fetch tweets, retweets and comments from a user', async () => {
    const user = await createUser()
    const secondUser = await createUser('second', 'second@test.fr', 'Second')
    const tweet = await createTweet(user, 'First tweet', 'tweet')
    const secondTweet = await createTweet(secondUser, 'Second tweet', 'tweet')
    const comment = await createTweet(user, 'First comment', 'comment')
    const retweet = await createRetweet(user, secondTweet)

    const { query } = await testClient({
      req: {
        headers: {
          authorization: 'Bearer ' + generateToken(user),
        },
      },
    })

    const res = await query({
      query: TWEETS,
      variables: {
        user_id: user.id,
        filter: 'WITH_COMMENTS',
      },
    })

    expect(res.data.tweets).not.toBeNull()
    expect(res.data.tweets.length).toEqual(3)
  })

  it('should only fetch likes from a user', async () => {
    const user = await createUser()
    const secondUser = await createUser('second', 'second@test.fr', 'Second')
    const tweet = await createTweet(user, 'Blah', 'tweet')
    const tweetToLike = await createTweet(secondUser, 'First tweet', 'tweet')
    const like = await createLike(user, tweetToLike)

    const { query } = await testClient({
      req: {
        headers: {
          authorization: 'Bearer ' + generateToken(user),
        },
      },
    })

    const res = await query({
      query: TWEETS,
      variables: {
        user_id: user.id,
        filter: 'ONLY_LIKES',
      },
    })

    expect(res.data.tweets).not.toBeNull()
    expect(res.data.tweets.length).toEqual(1)
  })

  it('should only fetch tweets with a media from a user', async () => {
    const user = await createUser()
    const tweet = await createTweet(user, 'Blah', 'tweet')
    const tweetWithouMedia = await createTweet(user, 'withoutMedia', 'tweet')
    const media = await createMedia(user, tweet)

    const { query } = await testClient({
      req: {
        headers: {
          authorization: 'Bearer ' + generateToken(user),
        },
      },
    })

    const res = await query({
      query: TWEETS,
      variables: {
        user_id: user.id,
        filter: 'ONLY_MEDIA',
      },
    })

    expect(res.data.tweets).not.toBeNull()
    expect(res.data.tweets.length).toEqual(1)
  })
})
