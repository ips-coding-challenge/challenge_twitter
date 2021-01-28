import DataLoader from 'dataloader'
import db from '../db/connection'
import Tweet from '../entities/Tweet'
import User from '../entities/User'
import { selectCountsForTweet } from '../utils/utils'

export const dataloaders = {
  userDataloader: new DataLoader<number, User, unknown>(async (ids) => {
    const users = await db('users').whereIn('id', ids)

    return ids.map((id) => users.find((u) => u.id === id))
  }),
  isLikedDataloader: new DataLoader<any, any, unknown>(async (keys) => {
    const tweetIds = keys.map((k: any) => k.tweet_id)
    const userId = keys[0].user_id

    const likes = await db('likes')
      .whereIn('tweet_id', tweetIds)
      .andWhere('user_id', userId)
    return tweetIds.map((id) => likes.find((l) => l.tweet_id === id))
  }),
  isRetweetedDataloader: new DataLoader<any, any, unknown>(async (keys) => {
    const tweetIds = keys.map((k: any) => k.tweet_id)
    const userId = keys[0].user_id

    const retweets = await db('retweets')
      .whereIn('tweet_id', tweetIds)
      .andWhere('user_id', userId)
    return tweetIds.map((id) => retweets.find((r) => r.tweet_id === id))
  }),
  isBookmarkedDataloader: new DataLoader<any, any, unknown>(async (keys) => {
    const tweetIds = keys.map((k: any) => k.tweet_id)
    const userId = keys[0].user_id

    const bookmarks = await db('bookmarks')
      .whereIn('tweet_id', tweetIds)
      .andWhere('user_id', userId)
    return tweetIds.map((id) => bookmarks.find((r) => r.tweet_id === id))
  }),
  parentTweetDataloader: new DataLoader<number, Tweet, unknown>(async (ids) => {
    const parents = await db('tweets')
      .whereIn('id', ids)
      .select(selectCountsForTweet(db))
    return ids.map((id) => parents.find((p) => p.id === id))
  }),
  previewLinkDataloader: new DataLoader<number, unknown, unknown>(
    async (ids) => {
      const previews = await db('previews as p')
        .innerJoin('previews_tweets as pt', 'pt.preview_id', '=', 'p.id')
        .whereIn('pt.tweet_id', ids)
        .select(['p.*', 'pt.tweet_id'])

      return ids.map((id) => previews.find((p) => p.tweet_id === id))
    }
  ),
}
