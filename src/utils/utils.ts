import { AuthenticationError } from 'apollo-server'
import jwt from 'jsonwebtoken'
import Knex from 'knex'
import { JWT_SECRET } from '../config/config'
import User from '../entities/User'
import InvalidTokenError from '../errors/InvalidTokenError'
import puppeteer from 'puppeteer'

export const generateToken = (
  user: User,
  expiresIn: string | number | undefined = '7d'
) => {
  const token = jwt.sign(
    {
      data: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
      },
    },
    JWT_SECRET as string,
    { expiresIn } // 7 days
  )
  return token
}

export const extractJwtToken = (req: any) => {
  try {
    if (!req.headers || !req.headers.authorization) {
      throw new AuthenticationError('Unauthorized')
    }

    const parts = req.headers.authorization.split(' ')

    if (parts.length === 2) {
      const scheme = parts[0]
      const credentials = parts[1]

      if (/^Bearer$/i.test(scheme)) {
        return credentials
      } else {
        throw new InvalidTokenError()
      }
    }
  } catch (e) {
    throw e
  }
}

export const selectCountsForTweet = (db: Knex) => {
  return [
    db.raw(
      '(SELECT count(tweet_id) from likes where likes.tweet_id = tweets.id) as "likesCount"'
    ),
    db.raw(
      `(SELECT count(t.parent_id) from tweets t where t.parent_id = tweets.id and t.type = 'comment') as "commentsCount"`
    ),
    db.raw(
      `(SELECT count(tweet_id) from retweets where retweets.tweet_id = tweets.id) as "retweetsCount"`
    ),
    db.raw(
      `(SELECT count(tweet_id) from bookmarks where bookmarks.tweet_id = tweets.id) as "bookmarksCount"`
    ),
    'tweets.*',
  ]
}

export const scrap = async (url: string) => {
  const browser = await puppeteer.launch({
    headless: true,
  })
  try {
    const page = await browser.newPage()
    console.log('url', url)
    await page.goto(url)
    const results = await page.evaluate(() => {
      // @ts-ignore
      const title = document
        .querySelector("meta[property='og:title']")
        .getAttribute('content')
      // @ts-ignore
      const image = document
        .querySelector("meta[property='og:image']")
        .getAttribute('content')
      // @ts-ignore
      const description = document
        .querySelector("meta[property='og:description']")
        .getAttribute('content')
      // @ts-ignore
      const url = document
        .querySelector("meta[property='og:url']")
        .getAttribute('content')

      return {
        title,
        image,
        description,
        url,
      }
    })

    return results
  } catch (e) {
    console.log('e', e)
  } finally {
    browser.close()
  }
}
