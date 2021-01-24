import * as Knex from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('hashtags_tweets', (t) => {
    t.bigIncrements('id')
    t.integer('hashtag_id').unsigned().notNullable()
    t.integer('tweet_id').unsigned().notNullable()
    t.timestamps(false, true)

    t.unique(['hashtag_id', 'tweet_id'])

    t.foreign('hashtag_id')
      .references('id')
      .inTable('hashtags')
      .onDelete('CASCADE')
    t.foreign('tweet_id').references('id').inTable('tweets').onDelete('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.raw('DROP TABLE hashtags_tweets CASCADE')
}
