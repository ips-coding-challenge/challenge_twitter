import createServer from './server'

const main = async () => {
  const server = await createServer()

  server.listen().then(({ port }) => {
    console.log(`Listening on port ${port}`)
  })
}
main()
