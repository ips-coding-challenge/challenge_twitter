import { ApolloError } from 'apollo-server'
import { Arg, Authorized, Ctx, Mutation, Resolver } from 'type-graphql'
import { MyContext } from '../types/types'

@Resolver()
class BookmarkResolver {
  @Mutation(() => String)
  @Authorized()
  async toggleBookmark(
    @Arg('tweet_id') tweet_id: number,
    @Ctx() ctx: MyContext
  ) {
    const { db, userId } = ctx

    const [tweet] = await db('tweets').where('id', tweet_id)

    if (!tweet) {
      throw new ApolloError('Tweet not found')
    }

    const data = {
      user_id: userId,
      tweet_id: tweet_id,
    }

    try {
      const [alreadyBookmarked] = await db('bookmarks').where(data)

      if (alreadyBookmarked) {
        // Delete the like and return
        await db('bookmarks').where(data).del()

        return 'Bookmark deleted'
      }

      await db('bookmarks').insert(data)

      return 'Bookmark added'
    } catch (e) {
      throw new ApolloError(e.message)
    }
  }
}

export default BookmarkResolver
