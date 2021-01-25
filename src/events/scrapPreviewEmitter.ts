import { EventEmitter } from 'events'
import { scrap } from '../utils/utils'
import knex from '../db/connection'
import { dataloaders } from '../dataloaders/dataloaders'

const scrapPreviewEmitter = new EventEmitter()

scrapPreviewEmitter.on('scrap', async (url: string, tweet_id: number) => {
  try {
    const result = await scrap(url)
    const previewsIds = await knex('previews')
      .insert({
        ...result,
        url,
      })
      .onConflict('url')
      .ignore()
      .returning('id')

    const toInsert = previewsIds.map((id) => {
      return {
        preview_id: id,
        tweet_id: tweet_id,
      }
    })

    await knex('previews_tweets').insert(toInsert)
    dataloaders.previewLinkDataloader.clear(tweet_id)
  } catch (e) {
    console.log('e', e)
  }
})

export default scrapPreviewEmitter
