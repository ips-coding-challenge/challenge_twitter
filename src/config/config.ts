import * as dotenv from 'dotenv'

dotenv.config({ path: `${__dirname}/../../.env.${process.env.NODE_ENV}` })

export const PORT = process.env.PORT
export const JWT_SECRET = process.env.JWT_SECRET
