import db from '../db/connection'
import { FEED } from './queries/tweets.queries'
import { testClient } from './setup'

describe('Tweets', () => {
  beforeEach(async () => {
    await db.migrate.rollback()
    await db.migrate.latest()
    await db.seed.run()
  })

  afterEach(async () => {
    await db.migrate.rollback()
  })

  test('it should fetch the tweets with user', async () => {
    const { query } = await testClient()

    const res = await query({
      query: FEED,
    })

    expect(res.data.feed[0]).toMatchSnapshot()
  })
})
