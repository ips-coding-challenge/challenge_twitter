import * as Knex from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('hashtags', (t) => {
    t.bigIncrements('id')
    t.string('hashtag').unique()
    t.timestamps(false, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.raw('DROP TABLE hashtags CASCADE')
}
