import { gql } from 'apollo-server'
import knex from '../db/connection'
import { testClient } from './setup'
import { createUser } from './helpers'
import { ValidationError } from 'class-validator'

const REGISTER = gql`
  mutation($input: RegisterPayload!) {
    register(input: $input) {
      token
      user {
        id
        username
        display_name
        email
        created_at
        updated_at
      }
    }
  }
`
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
