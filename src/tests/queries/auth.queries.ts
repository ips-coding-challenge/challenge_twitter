import { gql } from 'apollo-server'

export const REGISTER = gql`
  mutation($input: RegisterPayload!) {
    register(input: $input) {
      token
      user {
        id
        username
        display_name
        email
        created_at
        updated_at
      }
    }
  }
`
export const LOGIN = gql`
  mutation($input: LoginPayload!) {
    login(input: $input) {
      token
      user {
        id
        email
        username
      }
    }
  }
`
