import db from '../db/connection'
import argon2 from 'argon2'

export const createUser = async (
  username = 'admin',
  email = 'admin@test.fr',
  display_name = 'Admin',
  password = 'password'
) => {
  const hash = await argon2.hash(password)
  const [user] = await db('users')
    .insert({
      username,
      email,
      display_name,
      password: hash,
    })
    .returning('*')

  return user
}
