import { EventEmitter } from 'events'

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

const scrapPreviewEmitter = new EventEmitter()

scrapPreviewEmitter.on('scrap', async (url) => {
  console.log('url to scrap', url)
})

export default scrapPreviewEmitter
