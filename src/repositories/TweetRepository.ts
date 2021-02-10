import Knex from 'knex'
import Tweet from '../entities/Tweet'
import { selectCountsForTweet } from '../utils/utils'
import BaseRepository from './BaseRepository'

class TweetRepository extends BaseRepository {
  // Get the feed from the user
  async feed(
    userId: number,
    followedUsers: any[],
    limit: number = 20,
    offset: number = 0
  ) {
    const select = [
      'tweets.id',
      'tweets.body',
      'tweets.user_id',
      'tweets.parent_id',
      'tweets.visibility',
      'tweets.type',
      ...selectCountsForTweet(this.db),
    ]

    const tweets = await this.db
      .from(
        this.db
          // I do a union from 3 subqueries
          .union(
            [
              // First Query
              // I select the tweets from the tweets table
              // and it will return the tweets and comments
              this.db
                .select([
                  ...select,
                  'tweets.created_at',
                  this.db.raw('NULL as like_author'), // Need to have the same number of columns for
                  this.db.raw('NULL as retweet_author'), // all the 3 queries
                ])
                .from('tweets')
                // I want the tweets/comments from the followedUsers and
                // those from the connected user
                .whereIn('tweets.user_id', [...followedUsers, userId]),
              // SECOND Query
              this.db
                .select([
                  ...select,
                  'likes.created_at',
                  // I concat the display_name and username
                  // I will need that to show "Like by @user" in the client
                  this.db.raw(
                    `concat (users.display_name,',', users.username) as like_author`
                  ),
                  this.db.raw('NULL'),
                ])
                .from('tweets')
                .innerJoin('likes', 'likes.tweet_id', '=', 'tweets.id')
                .innerJoin('users', 'users.id', '=', 'likes.user_id')
                // I only want the likes from the followedUsers
                .whereIn('tweets.id', function () {
                  this.select('l.tweet_id')
                    .from('likes as l')
                    .whereIn('l.user_id', followedUsers)
                })
                // And if the user liked and retweeted the tweet, I "ignore" the like
                .whereNotIn('tweets.id', function () {
                  this.select('retweets.tweet_id')
                    .from('retweets')
                    .whereIn('retweets.user_id', followedUsers)
                })
                // I don't want the connected users likes
                .andWhere('likes.user_id', '!=', userId),

              // Third QUERY
              this.db
                .select([
                  ...select,
                  'retweets.created_at',
                  this.db.raw('NULL'),
                  this.db.raw(
                    `concat (users.display_name,',', users.username) as retweet_author`
                  ),
                ])
                .from('tweets')
                .innerJoin('retweets', 'retweets.tweet_id', '=', 'tweets.id')
                .innerJoin('users', 'users.id', '=', 'retweets.user_id')
                .whereIn('tweets.id', function () {
                  this.select('rt.tweet_id')
                    .from('retweets as rt')
                    .whereIn('rt.user_id', followedUsers)
                })
                .andWhere('retweets.user_id', '!=', userId),
            ],
            // Put parenthesis between the queries (Knex option)
            // select * from ((select * from foo) union (select * from bar)) results
            true
          )
          .as('results')
      )
      // One thing to notice is the order will be by the different created_at Field
      // In the first query, I select the tweets.created_at
      // In the second query, I select the likes.created_at
      // In the third query, I select the retweets.created_at
      // I can then have the order by created_at that I want.
      .orderBy('id', 'desc')
      .limit(limit)
      .offset(offset)

    return tweets
  }
}

export default TweetRepository
