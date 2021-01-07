import { AuthenticationError } from 'apollo-server'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../config/config'
import User from '../entities/User'
import InvalidTokenError from '../errors/InvalidTokenError'

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

export const extractJwtToken = (req: any) => {
  try {
    if (!req.headers || !req.headers.authorization) {
      throw new AuthenticationError('Unauthorized')
    }

    const parts = req.headers.authorization.split(' ')

    if (parts.length === 2) {
      const scheme = parts[0]
      const credentials = parts[1]

      if (/^Bearer$/i.test(scheme)) {
        return credentials
      } else {
        throw new InvalidTokenError()
      }
    }
  } catch (e) {
    throw e
  }
}
