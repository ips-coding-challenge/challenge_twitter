import DataLoader from 'dataloader'
import db from '../db/connection'
import Media from '../entities/Media'
import Tweet from '../entities/Tweet'
import TweetStats from '../entities/TweetUserInfo'
import User from '../entities/User'
import { selectCountsForTweet } from '../utils/utils'

export const dataloaders = {
  userDataloader: new DataLoader<number, User, unknown>(async (ids) => {
    const users = await db('users').whereIn('id', ids)

    return ids.map((id) => users.find((u) => u.id === id))
  }),
  tweetUserInfosDataloader: new DataLoader<any, any, unknown>(async (keys) => {
    const tweetIds = keys.map((k: any) => k.tweet_id)
    const userId = keys[0].user_id
    const infos = await db.from(
      db
        .union(
          [
            db
              .select(
                db.raw(
                  `likes.tweet_id as liked, cast(null as int) as retweeted, cast(null as int) as bookmarked`
                )
              )
              .from('likes')
              .whereIn('likes.tweet_id', tweetIds)
              .andWhere('user_id', userId),
            db
              .select(db.raw(`null, retweets.tweet_id as retweeted, null`))
              .from('retweets')
              .whereIn('retweets.tweet_id', tweetIds)
              .andWhere('user_id', userId),
            db
              .select(db.raw(`null, null, bookmarks.tweet_id as bookmarked`))
              .from('bookmarks')
              .whereIn('bookmarks.tweet_id', tweetIds)
              .andWhere('user_id', userId),
          ],
          true
        )
        .as('results')
    )

    return tweetIds.map((id) => {
      const results = infos.reduce((acc, current) => {
        for (const [key, value] of Object.entries(current)) {
          if (value) {
            const index = acc.findIndex((el: any) => el.id === value)
            if (index > -1) {
              acc[index] = { ...acc[index], infos: [...acc[index].infos, key] }
            } else {
              acc.push({ id: value, infos: [key] })
            }
          }
        }

        return acc
      }, [])

      return results.find((r: any) => r.id === id)
    })
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
      .select(['tweets.*', ...selectCountsForTweet(db)])
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
  mediaDataloader: new DataLoader<number, Media, unknown>(async (ids) => {
    const medias = await db('medias').whereIn('tweet_id', ids)

    return ids.map((id) => medias.find((m) => m.tweet_id === id))
  }),
  followersCountDataloader: new DataLoader<number, any, any>(async (ids) => {
    console.log('ids', ids)
    const followersCount = await db('followers')
      .count('follower_id')
      .whereIn('following_id', ids)
      .select('following_id as id')
      .groupBy('id')

    return ids.map((id) => followersCount.find((f) => f.id === id))
  }),
  followingsCountDataloader: new DataLoader<number, any, any>(async (ids) => {
    const followingsCount = await db('followers')
      .count('following_id')
      .whereIn('follower_id', ids)
      .select('follower_id as id')
      .groupBy('id')

    return ids.map((id) => followingsCount.find((f) => f.id === id))
  }),
  followingsUsersIdsDataloader: new DataLoader<number, any, any>(
    async (ids) => {
      const followingsIds = await db('followers')
        .whereIn('follower_id', ids)
        .pluck('following_id')

      return ids.map((id) => followingsIds)
    }
  ),
}
