import DataLoader from 'dataloader'
import Knex from 'knex'
import User from '../entities/User'

export type MyContext = {
  req: any
  res: any
  db: Knex
  userId: number
  dataloaders: {
    userDataloader: DataLoader<number, User, unknown>
  }
}
