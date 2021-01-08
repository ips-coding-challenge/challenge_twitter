import * as Knex from 'knex'
import faker from 'faker'
import argon2 from 'argon2'
import User from '../../entities/User'

export async function seed(knex: Knex): Promise<void> {
  await knex('users').del()
  await knex('tweets').del()

  for (let user of await createUsers()) {
    const [insertedUser] = await knex('users').insert(user).returning('*')

    const tweetsToInsert = await createTweets(insertedUser)
    await knex('tweets').insert(tweetsToInsert)
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
