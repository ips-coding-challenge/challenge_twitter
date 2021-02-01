import { Ctx, Query, Resolver } from 'type-graphql'
import Hashtag from '../entities/Hashtag'
import { MyContext } from '../types/types'

@Resolver()
class HashtagResolver {
  @Query(() => [Hashtag])
  async trendingHashtags(@Ctx() ctx: MyContext) {
    const { db } = ctx

    const hashtags = await db({ h: 'hashtags' })
      .distinct('h.hashtag', 'h.id')
      .select(
        db.raw(
          '(SELECT count(hashtags_tweets.hashtag_id) from hashtags_tweets WHERE hashtags_tweets.hashtag_id = h.id) as "tweetsCount"'
        )
      )
      .innerJoin('hashtags_tweets as ht', 'h.id', '=', 'ht.hashtag_id')
      .whereRaw(`ht.created_at > NOW() -  interval '7 days'`)
      .groupBy('h.id', 'ht.created_at')
      .orderBy('tweetsCount', 'desc')
      .limit(10)

    return hashtags
  }
}

export default HashtagResolver
