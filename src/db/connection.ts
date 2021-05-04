import Knex from 'knex'
import KnexTinyLogger from 'knex-tiny-logger'

const config = require('../../knexfile')[process.env.NODE_ENV || 'development']

const knex =
  process.env.DEBUG === 'true' ? KnexTinyLogger(Knex(config)) : Knex(config)

export default knex
