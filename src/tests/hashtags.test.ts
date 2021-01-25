import { ValidationError } from 'apollo-server'
import db from '../db/connection'
import { generateToken } from '../utils/utils'
import { createHashtag, createUser } from './helpers'
import { ADD_TWEET } from './queries/tweets.queries'
import { testClient } from './setup'

describe('Hashtags', () => {
  beforeEach(async () => {
    await db.migrate.rollback()
    await db.migrate.latest()
  })

  afterEach(async () => {
    await db.migrate.rollback()
  })

  it('should insert hashtags when adding a tweet', async () => {
    const user = await createUser()

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
          body: `Really nice Tweet
          
          https://machin.fr
          
          #machin #truc`,
          hashtags: ['#machin', '#truc'],
        },
      },
    })

    const hashtags = await db('hashtags').pluck('id')

    expect(hashtags.length).toEqual(2)

    const tweets_hashtags = await db('hashtags_tweets')
      .whereIn('hashtag_id', hashtags)
      .andWhere('tweet_id', res.data.addTweet.id)

    expect(tweets_hashtags.length).toEqual(2)
  })

  it('should not insert a hashtag if its already in the database', async () => {
    const user = await createUser()
    const hashTag = await createHashtag('#machin')

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
          body: `Really nice Tweet
          
          https://machin.fr
          
          #machin #truc`,
          hashtags: ['#machin', '#truc'],
        },
      },
    })

    const hashtags = await db('hashtags')
      .whereIn('hashtag', ['#machin', '#truc'])
      .pluck('id')

    expect(hashtags.length).toEqual(2)

    const tweets_hashtags = await db('hashtags_tweets')
      .whereIn('hashtag_id', hashtags)
      .andWhere('tweet_id', res.data.addTweet.id)

    expect(tweets_hashtags.length).toEqual(2)
  })

  it('should not insert a duplicate hashtag', async () => {
    const user = await createUser()

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
          body: `Really nice Tweet
          
          https://machin.fr
          
          #machin #truc`,
          hashtags: ['#machin', '#truc', '#machin'],
        },
      },
    })

    expect(res.errors).not.toBeUndefined()

    const {
      extensions: {
        exception: { validationErrors },
      },
    }: any = res.errors![0]

    expect((validationErrors[0] as ValidationError).constraints).toEqual({
      arrayUnique: "All hashtags's elements must be unique",
    })
  })

  it('should not insert invalid hashtag', async () => {
    const user = await createUser()

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
          body: `Really nice Tweet

          https://machin.fr
          
          #machin #truc`,
          hashtags: ['machin', '#truc'],
        },
      },
    })

    expect(res.errors).not.toBeUndefined()

    const {
      extensions: {
        exception: { validationErrors },
      },
    }: any = res.errors![0]

    expect((validationErrors[0] as ValidationError).constraints).toEqual({
      matches:
        'Each hashtag should start with a # and have a length betweet 2 and 20 characters',
    })
  })
})
