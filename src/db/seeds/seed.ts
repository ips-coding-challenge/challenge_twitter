import argon2 from 'argon2'
import faker from 'faker'
import * as Knex from 'knex'
import User from '../../entities/User'

export async function seed(knex: Knex): Promise<void> {
  await knex('users').del()
  await knex('tweets').del()
  await knex('likes').del()

  for (let user of await createUsers()) {
    const [insertedUser] = await knex('users').insert(user).returning('*')

    const tweetsToInsert = await createTweets(insertedUser)
    await knex('tweets').insert(tweetsToInsert)
  }

  // Like some tweets
  const allTweets = await knex('tweets').pluck('id')
  const allUsers = await knex('users')

  for (let user of allUsers) {
    allTweets.sort(() => 0.5 - Math.random())
    await knex('likes').insert(createRandomLikes(user, allTweets, 20))
  }
}

const createUsers = async () => {
  let users = []
  const hash = await argon2.hash('password')
  for (let i = 0; i < 10; i++) {
    users.push({
      username: faker.internet.userName(),
      display_name: faker.name.firstName(),
      email: faker.internet.email(),
      avatar: faker.internet.avatar(),
      password: hash,
    })
  }
  return users
}

const createTweets = async (user: User) => {
  let tweets = []

  for (let i = 0; i < 20; i++) {
    tweets.push({
      body: faker.lorem.sentence(),
      type: 'tweet',
      user_id: user.id,
      visibility: faker.random.arrayElement(['public', 'followers']),
    })
  }
  return tweets
}

const createRandomLikes = (user: User, tweetIds: number[], max: number) => {
  let randomLikes = []
  const copy = [...tweetIds]
  for (let i = 0; i < max; i++) {
    const randomTweetId = copy.sort(() => 0.5 - Math.random()).pop()
    randomLikes.push({
      user_id: user.id,
      tweet_id: randomTweetId,
    })
  }

  return randomLikes
}
