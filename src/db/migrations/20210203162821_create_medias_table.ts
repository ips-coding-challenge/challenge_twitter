import * as Knex from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('medias', (t) => {
    t.bigIncrements('id')
    t.string('url').notNullable()
    t.integer('tweet_id').unsigned().notNullable().unique()
    t.integer('user_id').unsigned().notNullable()
    t.timestamps(false, true)

    t.foreign('tweet_id').references('id').inTable('tweets').onDelete('CASCADE')
    t.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.raw('DROP TABLE medias CASCADE')
}
