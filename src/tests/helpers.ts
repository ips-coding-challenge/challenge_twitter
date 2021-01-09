import db from '../db/connection'
import argon2 from 'argon2'
import User from '../entities/User'

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

export const createTweet = async (
  user: User,
  body = 'A tweet',
  type = 'tweet',
  visibility = 'public'
) => {
  const [tweet] = await db('tweets')
    .insert({
      body,
      user_id: user.id,
      type,
      visibility,
    })
    .returning('*')

  return tweet
}
