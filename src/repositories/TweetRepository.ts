import Knex from 'knex'
import Tweet from '../entities/Tweet'
import { selectCountsForTweet } from '../utils/utils'
import BaseRepository from './BaseRepository'

export enum Filters {
  TWEETS_RETWEETS,
  WITH_COMMENTS,
  ONLY_MEDIA,
  ONLY_LIKES,
}

class TweetRepository extends BaseRepository {
  async tweet(tweet_id: number): Promise<Tweet> {
    const [tweet] = await this.db('tweets')
      .where('id', tweet_id)
      .select(['tweets.*', ...selectCountsForTweet(this.db)])

    return tweet
  }

  // get the tweets from a particular user
  async tweets(
    userId: number,
    limit: number = 20,
    offset: number = 0,
    filter?: Filters
  ) {
    const qb = this.db('tweets')
    let select = ['tweets.*', ...selectCountsForTweet(this.db)]

    if (
      filter === Filters.TWEETS_RETWEETS ||
      filter === Filters.WITH_COMMENTS
    ) {
      select = [
        ...select,
        this.db.raw(
          'greatest(tweets.created_at, retweets.created_at) as greatest_created_at'
        ),
        this.db.raw(
          '(select rt.tweet_id from retweets rt where rt.tweet_id = tweets.id and rt.user_id = ?) as original_tweet_id',
          [userId]
        ),
      ]
      qb.fullOuterJoin('retweets', 'retweets.tweet_id', '=', 'tweets.id')
      qb.orderBy('greatest_created_at', 'desc')
      qb.orWhere('retweets.user_id', userId)
      qb.orWhere('tweets.user_id', userId)

      if (filter === Filters.TWEETS_RETWEETS) {
        qb.andWhere('type', 'tweet')
      }
    }

    if (filter === Filters.ONLY_MEDIA) {
      qb.innerJoin('medias', 'medias.tweet_id', 'tweets.id')
      qb.where('medias.user_id', userId)
      qb.orderBy('created_at', 'desc')
    }

    if (filter === Filters.ONLY_LIKES) {
      select = [
        ...select,
        this.db.raw(
          'greatest(tweets.created_at, likes.created_at) as greatest_created_at'
        ),
        this.db.raw(
          '(select l.tweet_id from likes l where l.tweet_id = tweets.id and l.user_id = ?) as original_tweet_id',
          [userId]
        ),
      ]
      qb.innerJoin('likes', 'likes.tweet_id', 'tweets.id')
      qb.where('likes.user_id', userId)
      qb.orderBy('greatest_created_at', 'desc')
    }

    return await qb.select(select).limit(limit).offset(offset)
  }

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

    const [total]: any = await this.totalCountFeed(followedUsers, userId)

    if (offset > total) {
      return []
    }

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

  async totalCountFeed(followedUsers: any[], userId: number) {
    return await this.db.sum(this.db.raw('cnt')).from(
      this.db
        // I do a union from 3 subqueries
        .union(
          [
            // First Query
            // I select the tweets from the tweets table
            // and it will return the tweets and comments
            this.db
              .select(this.db.raw('count(tweets.id) as cnt'))
              .from('tweets')
              // I want the tweets/comments from the followedUsers and
              // those from the connected user
              .whereIn('tweets.user_id', [...followedUsers, userId]),
            // SECOND Query
            this.db
              .select(this.db.raw('count(tweets.id) as cnt'))
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
              .select(this.db.raw('count(tweets.id) as cnt'))
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
  }
}

export default TweetRepository
