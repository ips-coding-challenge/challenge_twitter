import * as Knex from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('retweets', (t) => {
    t.increments('id')
    t.integer('user_id').unsigned().notNullable()
    t.integer('tweet_id').unsigned().notNullable()

    t.unique(['user_id', 'tweet_id'])

    t.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')
    t.foreign('tweet_id').references('id').inTable('tweets').onDelete('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.raw('DROP TABLE retweets CASCADE')
}
