import db from '../db/connection'
import { generateToken } from '../utils/utils'
import { createUser, followUser } from './helpers'
import { testClient } from './setup'
import { TOGGLE_FOLLOW } from './queries/followers.queries'

describe('Followers', () => {
  beforeEach(async () => {
    await db.migrate.rollback()
    await db.migrate.latest()
  })

  afterEach(async () => {
    await db.migrate.rollback()
  })

  it('should add a user to follow', async () => {
    const user = await createUser()
    const userToFollow = await createUser('new', 'new@test.fr')

    const { mutate } = await testClient({
      req: {
        headers: {
          authorization: 'Bearer ' + generateToken(user),
        },
      },
    })

    const res = await mutate({
      mutation: TOGGLE_FOLLOW,
      variables: {
        following_id: userToFollow.id,
      },
    })

    const [follower] = await db('followers').where({
      follower_id: user.id,
      following_id: userToFollow.id,
    })

    expect(follower).not.toBeUndefined()

    expect(res.data.toggleFollow).toEqual('User followed!')
  })

  it('should delete a user that a user follow', async () => {
    const user = await createUser()
    const userToFollow = await createUser('new', 'new@test.fr')
    await followUser(user, userToFollow)

    const { mutate } = await testClient({
      req: {
        headers: {
          authorization: 'Bearer ' + generateToken(user),
        },
      },
    })

    const res = await mutate({
      mutation: TOGGLE_FOLLOW,
      variables: {
        following_id: userToFollow.id,
      },
    })

    const [follower] = await db('followers').where({
      follower_id: user.id,
      following_id: userToFollow.id,
    })

    expect(follower).toBeUndefined()

    expect(res.data.toggleFollow).toEqual(
      'You are no longer following this user'
    )
  })
})
