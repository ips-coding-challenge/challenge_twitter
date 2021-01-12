import DataLoader from 'dataloader'
import db from '../db/connection'
import Tweet, { TweetTypeEnum } from '../entities/Tweet'
import User from '../entities/User'

export const dataloaders = {
  userDataloader: new DataLoader<number, User, unknown>(async (ids) => {
    const users = await db('users').whereIn('id', ids)

    return ids.map((id) => users.find((u) => u.id === id))
  }),
  // Get the likesCount for each tweet
  likesCountDataloader: new DataLoader<number, any, unknown>(async (ids) => {
    const counts = await db('likes')
      .whereIn('tweet_id', ids)
      .count('tweet_id', { as: 'likesCount' })
      .select('tweet_id')
      .groupBy('tweet_id')

    return ids.map((id) => counts.find((c) => c.tweet_id === id))
  }),
  isLikedDataloader: new DataLoader<any, any, unknown>(async (keys) => {
    const tweetIds = keys.map((k: any) => k.tweet_id)
    const userId = keys[0].user_id

    const likes = await db('likes')
      .whereIn('tweet_id', tweetIds)
      .andWhere('user_id', userId)
    return tweetIds.map((id) => likes.find((l) => l.tweet_id === id))
  }),
  retweetsCountDataloader: new DataLoader<number, any, unknown>(async (ids) => {
    const counts = await db('tweets')
      .whereIn('parent_id', ids)
      .andWhere('type', TweetTypeEnum.RETWEET)
      .count('parent_id', { as: 'retweetsCount' })
      .select('parent_id')
      .groupBy('parent_id')

    return ids.map((id) => counts.find((c) => c.parent_id === id))
  }),
  commentsCountDataloader: new DataLoader<number, any, unknown>(async (ids) => {
    const counts = await db('tweets')
      .whereIn('parent_id', ids)
      .andWhere('type', TweetTypeEnum.COMMENT)
      .count('parent_id', { as: 'commentsCount' })
      .select('parent_id')
      .groupBy('parent_id')

    return ids.map((id) => counts.find((c) => c.parent_id === id))
  }),
  retweetsDataloader: new DataLoader<number, Tweet[], unknown>(async (ids) => {
    const retweets = await db('tweets')
      .whereIn('parent_id', ids)
      .andWhere('type', TweetTypeEnum.RETWEET)

    return ids.map((id) => retweets.filter((r) => r.parent_id === id))
  }),
  commentsDataloader: new DataLoader<number, Tweet[], unknown>(async (ids) => {
    const comments = await db('tweets')
      .whereIn('parent_id', ids)
      .andWhere('type', TweetTypeEnum.COMMENT)

    return ids.map((id) => comments.filter((c) => c.parent_id === id))
  }),
}
