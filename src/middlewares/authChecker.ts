import { AuthChecker } from 'type-graphql'
import { MyContext } from '../types/types'
import { extractJwtToken } from '../utils/utils'
import { verify } from 'jsonwebtoken'
import { JWT_SECRET } from '../config/config'
import { AuthenticationError } from 'apollo-server'

export const authChecker: AuthChecker<MyContext, string> = async (
  { root, args, context, info },
  roles
) => {
  const {
    db,
    req,
    dataloaders: { userDataloader },
  } = <MyContext>context

  try {
    const token = extractJwtToken(req)
    const {
      data: { id },
    }: any = verify(token, JWT_SECRET as string)

    const user = await userDataloader.load(id)

    if (!user) {
      throw new AuthenticationError('User not found')
    }

    context.userId = user.id
    return true
  } catch (e) {
    if (roles.includes('ANONYMOUS')) {
      context.userId = null
      return true
    }
    throw e
  }
}
