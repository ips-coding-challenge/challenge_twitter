import { EventEmitter } from 'events'
import { scrap } from '../utils/utils'

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

const scrapPreviewEmitter = new EventEmitter()

scrapPreviewEmitter.on('scrap', async (url) => {
  console.log('url to scrap', url)
  const result = await scrap(url)
  console.log('result', result)
})

export default scrapPreviewEmitter
