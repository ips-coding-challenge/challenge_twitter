import { ValidationError } from 'apollo-server'
import db from '../db/connection'
import { generateToken } from '../utils/utils'
import { createUser } from './helpers'
import { LOGIN, ME, REGISTER } from './queries/auth.queries'
import { testClient } from './setup'

describe('Auth', () => {
  beforeEach(async () => {
    await db.migrate.rollback()
    await db.migrate.latest()
  })

  afterEach(async () => {
    await db.migrate.rollback()
  })

  test('it should register a user', async () => {
    const { mutate } = await testClient()

    const res = await mutate({
      mutation: REGISTER,
      variables: {
        input: {
          username: 'admin',
          display_name: 'Admin',
          email: 'admin@test.fr',
          password: 'password',
        },
      },
    })

    const [newUser] = await db('users').where('username', 'admin')

    expect(newUser).not.toBeUndefined
    expect(newUser.username).toEqual('admin')
  })

  test('it should not register a user if the username is incorrect', async () => {
    const { mutate } = await testClient()

    const res = await mutate({
      mutation: REGISTER,
      variables: {
        input: {
          username: 'admin)',
          display_name: 'Admin',
          email: 'admin@test.fr',
          password: 'password',
        },
      },
    })
    expect(res).toMatchSnapshot()
    expect(res.data).toBeNull()
  })

  test('it should not register a user if the email already exists', async () => {
    await createUser('admin', 'admin@test.fr')

    const { mutate } = await testClient()

    const res = await mutate({
      mutation: REGISTER,
      variables: {
        input: {
          username: 'new',
          display_name: 'Admin',
          email: 'admin@test.fr',
          password: 'password',
        },
      },
    })

    expect(res.errors).not.toBeNull()

    const {
      extensions: {
        exception: { validationErrors },
      },
    }: any = res.errors![0]

    expect((validationErrors[0] as ValidationError).constraints).toEqual({
      UniqueConstraint: 'This email is already taken',
    })
    expect(res.data).toBeNull()
  })

  test('should log in a user', async () => {
    await createUser()
    const { mutate } = await testClient()

    const res = await mutate({
      mutation: LOGIN,
      variables: {
        input: {
          email: 'admin@test.fr',
          password: 'password',
        },
      },
    })

    const { token, user } = res.data.login
    expect(token).not.toBeNull()
    expect(user.username).toEqual('admin')
    expect(user.email).toEqual('admin@test.fr')
  })

  test('should throw a validation error if the email is invalid', async () => {
    await createUser()
    const { mutate } = await testClient()

    const res = await mutate({
      mutation: LOGIN,
      variables: {
        input: {
          email: 'adminaz',
          password: 'password',
        },
      },
    })

    expect(res.data).toBeNull()
    expect(res.errors).not.toBeNull()

    expect(res.errors![0].extensions).toMatchSnapshot()
    const {
      extensions: {
        exception: { validationErrors },
      },
    }: any = res.errors![0]

    expect((validationErrors[0] as ValidationError).constraints).toEqual({
      isEmail: 'email must be an email',
    })
  })

  test('should throw a validation error if the password is empty', async () => {
    await createUser()
    const { mutate } = await testClient()

    const res = await mutate({
      mutation: LOGIN,
      variables: {
        input: {
          email: 'admin@test.fr',
          password: '',
        },
      },
    })

    expect(res.data).toBeNull()
    expect(res.errors).not.toBeNull()
    expect(res.errors![0].extensions).toMatchSnapshot()
    const {
      extensions: {
        exception: { validationErrors },
      },
    }: any = res.errors![0]

    expect((validationErrors[0] as ValidationError).constraints).toEqual({
      isNotEmpty: 'password should not be empty',
    })
  })

  test('it should fetch the currentUser', async () => {
    const user = await createUser()

    const { query } = await testClient({
      req: { headers: { authorization: 'Bearer ' + generateToken(user) } },
    })

    const res = await query({
      query: ME,
    })

    expect(res.data).not.toBeNull()
    expect(res.data.me.id).toEqual(user.id)
  })

  test('it should throw an unauthorized error if there is no token', async () => {
    const user = await createUser()

    const { query } = await testClient()

    const res = await query({
      query: ME,
    })

    expect(res).toMatchSnapshot()
  })

  test('it should throw expired Token error', async () => {
    const user = await createUser()

    const { query } = await testClient({
      req: { headers: { authorization: 'Bearer ' + generateToken(user, -60) } },
    })

    const res = await query({
      query: ME,
    })

    expect(res).toMatchSnapshot()
  })
})
