import DataLoader from 'dataloader'
import { EventEmitter } from 'events'
import Knex from 'knex'
import Media from '../entities/Media'
import Tweet from '../entities/Tweet'
import User from '../entities/User'

export type MyContext = {
  req: any
  res: any
  db: Knex
  userId: number | null
  dataloaders: {
    userDataloader: DataLoader<number, User, unknown>
    tweetUserInfosDataloader: DataLoader<any, any, unknown>
    isLikedDataloader: DataLoader<any, any, unknown>
    parentTweetDataloader: DataLoader<number, Tweet, unknown>
    previewLinkDataloader: DataLoader<number, unknown, unknown>
    isRetweetedDataloader: DataLoader<any, any, unknown>
    isBookmarkedDataloader: DataLoader<any, any, unknown>
    mediaDataloader: DataLoader<number, Media, unknown>
  }
  bus: EventEmitter
}
