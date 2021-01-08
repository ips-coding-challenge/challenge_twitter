import * as Knex from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('tweets', (t) => {
    t.increments('id')
    t.text('body').notNullable()
    t.integer('user_id').unsigned().notNullable()
    t.integer('parent_id').unsigned()
    t.enum('visibility', ['public', 'followers']).defaultTo('public')
    t.enum('type', ['tweet', 'retweet', 'comment']).defaultTo('tweet')
    t.timestamps(false, true)

    t.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')
    t.foreign('parent_id')
      .references('id')
      .inTable('tweets')
      .onDelete('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.raw('DROP TABLE tweets CASCADE')
}
