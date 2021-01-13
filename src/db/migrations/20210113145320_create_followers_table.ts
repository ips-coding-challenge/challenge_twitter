import * as Knex from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('followers', (t) => {
    t.increments('id')
    t.integer('follower_id').notNullable()
    t.integer('following_id').notNullable()

    t.foreign('follower_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
    t.foreign('following_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.raw('DROP TABLE followers CASCADE')
}
