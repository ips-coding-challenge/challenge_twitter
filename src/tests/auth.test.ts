import { gql } from 'apollo-server'
import { testClient } from './setup'

const TEST = gql`
  query {
    me
  }
`

test('it should show hello', async () => {
  const { query } = await testClient()

  const res = await query({ query: TEST })

  expect(res.data.me).toEqual('Hello')
})
