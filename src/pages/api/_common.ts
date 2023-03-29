import { OAuth2Client } from "google-auth-library"
import type { NextApiRequest } from "next"
import Stripe from "stripe"

import type { ErrorCode } from "~core/constants"
import { init as initCohere } from "~core/llm/cohere"
import type { CacheGetter, CacheSetter, RequestData } from "~core/llm/model"
import { init as initOpenAI } from "~core/llm/openai"
import { init as initTogether } from "~core/llm/together"
import type { Result } from "~core/utils/result-monad"

// Basic in-memory cache. TODO replace w Redis
const cache = new Map<string, { completion: string }>()
const cacheGet: CacheGetter = async (key) => cache.get(key)?.completion
const cacheSet: CacheSetter = async (data) => cache.set(data.id, data)

export const DEFAULT_MAX_TOKENS = 256

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY")
}

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY, {
  apiVersion: "2022-11-15"
})

export type Request = { prompt: string }

export type Response<DataType = string, ErrorType = ErrorCode> = Result<
  DataType,
  ErrorType
>

export const openai = initOpenAI(
  process.env.OPENAI_API_KEY,
  {
    quality: "max",
    debug: process.env.NODE_ENV !== "production",
    cacheGet,
    cacheSet
  },
  {
    max_tokens: DEFAULT_MAX_TOKENS,
    presence_penalty: 0 // Using negative numbers causes 500s from davinci
    // stop_sequences: ['\n'],
  }
)

export const together = initTogether(
  process.env.TOGETHER_API_KEY || "",
  "Web41",
  {
    quality: "max", // TODO this currently 500s
    debug: process.env.NODE_ENV !== "production",
    cacheGet,
    cacheSet
  },
  {
    max_tokens: DEFAULT_MAX_TOKENS,
    temperature: 0.8
    // stop_sequences: ['\n'],
  }
)

export const cohere = initCohere(
  process.env.COHERE_API_KEY || "",
  {
    quality: "max",
    debug: process.env.NODE_ENV !== "production",
    cacheGet,
    cacheSet
  },
  {
    max_tokens: DEFAULT_MAX_TOKENS,
    temperature: 0.9
    // stop_sequences: ['\n'],
  }
)

export function isAdmin(email: string) {
  return process.env.ADMIN_EMAILS?.split(",").includes(email)
}

export async function authenticate(req: NextApiRequest) {
  if (req.method !== "POST") {
    throw new Error("Invalid request method")
  }
  const userInfo = await getUserInfo(req.headers.authorization)
  // TODO check subscription
  // const subscription = await getSubsciption(userInfo.email)

  // const code = subscription.status
  // if (subscription.status !== "active") {
  //   console.log("No subscription yet")
  // }
}

// Verify the Google JWT and get the user's info
export const getUserInfo = async (authHeader: string) => {
  const [type, accessToken] = authHeader.split(" ")

  if (type !== "Bearer" || !accessToken) {
    throw new Error("Invalid or no access token")
  }

  const client = new OAuth2Client()
  client.setCredentials({
    access_token: accessToken
  })

  const userInfoRes = await client.request<{
    id: string
    email: string
    name: string
  }>({
    url: "https://www.googleapis.com/oauth2/v1/userinfo"
  })

  return userInfoRes.data
}

export const getSubsciption = async (
  email: string
): Promise<Stripe.Subscription | undefined> => {
  const customerResp = await stripe.customers.list({
    email,
    limit: 1
  })

  if (customerResp.data.length === 0) {
    return undefined
  }

  const [customer] = customerResp.data

  const subscriptionResp = await stripe.subscriptions.list({
    customer: customer.id
  })

  return subscriptionResp.data[0]
}
