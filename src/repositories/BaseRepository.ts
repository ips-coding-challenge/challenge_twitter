import Knex from 'knex'

abstract class BaseRepository {
  db: Knex

  constructor(db: Knex) {
    this.db = db
  }
}

export default BaseRepository
