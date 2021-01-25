import { EventEmitter } from 'events'
import { scrap } from '../utils/utils'
import knex from '../db/connection'

const scrapPreviewEmitter = new EventEmitter()

scrapPreviewEmitter.on('scrap', async (url: string, tweet_id: number) => {
  try {
    const result = await scrap(url)
    const previewsIds = await knex('previews')
      .insert(result)
      .onConflict('url')
      .merge({
        title: result?.title,
        description: result?.description,
        image: result?.image,
        updated_at: knex.raw('NOW()'),
      })
      .returning('id')

    const toInsert = previewsIds.map((id) => {
      return {
        preview_id: id,
        tweet_id: tweet_id,
      }
    })

    await knex('previews_tweets').insert(toInsert)
  } catch (e) {
    console.log('e', e)
  }
})

export default scrapPreviewEmitter
