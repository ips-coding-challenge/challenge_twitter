import * as Knex from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', (t) => {
    t.string('bio').nullable()
    t.string('banner').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', (t) => {
    t.dropColumn('bio')
    t.dropColumn('banner')
  })
}
