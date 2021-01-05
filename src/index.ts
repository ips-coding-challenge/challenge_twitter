import dotenv from 'dotenv'
import path from 'path'
import createServer from './server'
dotenv.config({
  path: path.join(__dirname, `../.env.${process.env.NODE_ENV}`),
})

const main = async () => {
  const server = await createServer()

  server.listen().then(({ port }) => {
    console.log(`Listening on port ${port}`)
  })
}
main()
