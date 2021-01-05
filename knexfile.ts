// Update with your config settings.

module.exports = {
  development: {
    client: 'pg',
    connection: {
      database: 'challenge_twitter',
      user: 'postgres',
      password: 'root',
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: './src/db/migrations',
    },
    seeds: {
      directory: './src/db/seeds',
    },
  },
  test: {
    client: 'pg',
    connection: {
      database: 'challenge_twitter_test',
      user: 'postgres',
      password: 'root',
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: './src/db/migrations',
    },
    seeds: {
      directory: './src/db/seeds',
    },
  },
}
