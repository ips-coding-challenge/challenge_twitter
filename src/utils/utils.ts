import User from '../entities/User'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../config/config'
import { GraphQLFormattedError } from 'graphql'

export const generateToken = (user: User) => {
  const token = jwt.sign(
    {
      data: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
      },
    },
    JWT_SECRET as string,
    { expiresIn: '7d' } // 7 days
  )
  return token
}
