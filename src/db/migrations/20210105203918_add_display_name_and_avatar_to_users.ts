import * as Knex from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', (t) => {
    t.string('display_name').notNullable()
    t.string('avatar')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', (t) => {
    t.dropColumn('display_name')
    t.dropColumn('avatar')
  })
}
