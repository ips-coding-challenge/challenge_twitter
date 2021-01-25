import * as Knex from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('previews_tweets', (t) => {
    t.bigIncrements('id')
    t.integer('preview_id').notNullable()
    t.integer('tweet_id').notNullable()
    t.timestamps(false, true)

    t.unique(['preview_id', 'tweet_id'])

    t.foreign('preview_id')
      .references('id')
      .inTable('previews')
      .onDelete('CASCADE')
    t.foreign('tweet_id').references('id').inTable('tweets').onDelete('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.raw('DROP TABLE previews_tweets CASCADE')
}
