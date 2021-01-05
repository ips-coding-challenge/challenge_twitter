import Knex from 'knex'
import KnexTinyLogger from 'knex-tiny-logger'

const config = require('../../knexfile')[process.env.NODE_ENV || 'development']

export default KnexTinyLogger(Knex(config))
