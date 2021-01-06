import { ValidationError } from 'class-validator'
import knex from '../db/connection'
import { createUser } from './helpers'
import { LOGIN, REGISTER } from './queries/auth.queries'
import { testClient } from './setup'
import db from '../db/connection'

beforeEach(async () => {
  await knex.migrate.rollback()
  await knex.migrate.latest()
})

afterEach(async () => {
  await knex.migrate.rollback()
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

  const { token, user } = res.data.register
  expect(token).not.toBeNull()
  expect(user.username).toEqual('admin')
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

it('should log in a user', async () => {
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

it('should throw a validation error if the email is invalid', async () => {
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
  const {
    extensions: {
      exception: { validationErrors },
    },
  }: any = res.errors![0]

  expect((validationErrors[0] as ValidationError).constraints).toEqual({
    isEmail: 'email must be an email',
  })
})

it('should throw a validation error if the password is empty', async () => {
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
  const {
    extensions: {
      exception: { validationErrors },
    },
  }: any = res.errors![0]

  expect((validationErrors[0] as ValidationError).constraints).toEqual({
    isNotEmpty: 'password should not be empty',
  })
})
