import DataLoader from 'dataloader'
import { EventEmitter } from 'events'
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
    isLikedDataloader: DataLoader<any, any, unknown>
    parentTweetDataloader: DataLoader<number, Tweet, unknown>
    previewLinkDataloader: DataLoader<number, unknown, unknown>
    isRetweetedDataloader: DataLoader<any, any, unknown>
    isBookmarkedDataloader: DataLoader<any, any, unknown>
  }
  bus: EventEmitter
}
