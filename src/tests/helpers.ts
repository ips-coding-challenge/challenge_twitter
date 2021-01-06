import db from '../db/connection'

export const createUser = async (
  username = 'admin',
  email = 'admin@test.fr',
  display_name = 'Admin',
  password = 'password'
) => {
  const [user] = await db('users')
    .insert({
      username,
      email,
      display_name,
      password,
    })
    .returning('*')

  return user
}
