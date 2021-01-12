import DataLoader from 'dataloader'
import Knex from 'knex'
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
  }
}
