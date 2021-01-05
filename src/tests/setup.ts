import createServer from '../server'
import { createTestClient } from 'apollo-server-testing'

export const testClient = async () => {
  const server = await createServer()

  return createTestClient(server)
}
