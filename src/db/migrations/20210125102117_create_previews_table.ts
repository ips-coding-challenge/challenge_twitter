import * as Knex from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('previews', (t) => {
    t.bigIncrements('id')
    t.string('url').notNullable().unique()
    t.string('title').notNullable()
    t.text('description')
    t.string('image')
    t.timestamps(false, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.raw('DROP TABLE previews CASCADE')
}
