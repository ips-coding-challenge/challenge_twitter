import * as dotenv from 'dotenv'
import path from 'path'

const envPath = path.join(
  __dirname,
  `../../.env.${process.env.NODE_ENV || 'development'}`
)

dotenv.config({ path: envPath })

export const PORT = process.env.PORT
export const JWT_SECRET = process.env.JWT_SECRET
export const DB_HOST = process.env.DB_HOST
export const DB_NAME = process.env.DB_NAME
export const DB_USER = process.env.DB_USER
export const DB_PASSWORD = process.env.DB_PASSWORD
