import { OAuth2Client } from "google-auth-library"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY, {
  apiVersion: "2022-11-15"
})

export function isAdmin(email: string) {
  return process.env.ADMIN_EMAILS?.split(",").includes(email)
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

export const getSubsciption = async (email: string): Promise<Stripe.Subscription | undefined> => {
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

  if (subscriptionResp.data.length === 0) {
    throw new Error(`No subscription found for customer id ${customer.id}`)
  }

  return subscriptionResp.data[0]
}