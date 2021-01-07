import Knex from 'knex'

export type MyContext = {
  req: any
  res: any
  db: Knex
  userId: number
}
