import BaseRepository from './BaseRepository'

class FollowerRepository extends BaseRepository {
  async findAll(userId: number, pluck?: string) {
    const qb = this.db('followers').where('follower_id', userId)

    if (pluck) {
      qb.pluck(pluck)
    }

    return await qb
  }
}

export default FollowerRepository
