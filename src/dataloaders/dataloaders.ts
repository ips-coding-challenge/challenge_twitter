import DataLoader from 'dataloader'
import db from '../db/connection'
import User from '../entities/User'

export const dataloaders = {
  userDataloader: new DataLoader<number, User, unknown>(async (ids) => {
    const users = await db('users').whereIn('id', ids)

    return ids.map((id) => users.find((u) => u.id === id))
  }),
}
