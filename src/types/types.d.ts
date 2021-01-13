import DataLoader from 'dataloader'
import Knex from 'knex'
import Tweet from '../entities/Tweet'
import User from '../entities/User'

export type MyContext = {
  req: any
  res: any
  db: Knex
  userId: number | null
  dataloaders: {
    userDataloader: DataLoader<number, User, unknown>
    likesCountDataloader: DataLoader<number, any, unknown>
    isLikedDataloader: DataLoader<any, any, unknown>
    retweetsCountDataloader: DataLoader<number, any, unknown>
    commentsCountDataloader: DataLoader<number, any, unknown>
    parentTweetDataloader: DataLoader<number, Tweet, unknown>
  }
}
