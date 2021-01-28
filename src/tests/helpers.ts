import db from '../db/connection'
import argon2 from 'argon2'
import User from '../entities/User'
import Tweet from '../entities/Tweet'

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
  visibility = 'public',
  parent_id = null
) => {
  const [tweet] = await db('tweets')
    .insert({
      body,
      user_id: user.id,
      type,
      visibility,
      parent_id,
    })
    .returning('*')

  return tweet
}

export const createLike = async (user: User, tweet: Tweet) => {
  const [like] = await db('likes')
    .insert({
      user_id: user.id,
      tweet_id: tweet.id,
    })
    .returning('*')

  return like
}

export const followUser = async (user: User, following: User) => {
  await db('followers').insert({
    follower_id: user.id,
    following_id: following.id,
  })
}

export const createHashtag = async (hashtag: string) => {
  return await db('hashtags')
    .insert({
      hashtag,
    })
    .returning('*')
}

export const createRetweet = async (user: User, tweet: Tweet) => {
  const [retweet] = await db('retweets')
    .insert({
      user_id: user.id,
      tweet_id: tweet.id,
    })
    .returning('*')

  return retweet
}

export const createBookmark = async (user: User, tweet: Tweet) => {
  const [bookmark] = await db('bookmarks')
    .insert({
      user_id: user.id,
      tweet_id: tweet.id,
    })
    .returning('*')

  return bookmark
}
