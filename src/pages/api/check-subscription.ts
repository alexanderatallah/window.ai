import type { NextApiRequest, NextApiResponse } from "next"

import { getSubsciption, isAdmin } from "./_common"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "GET") {
      throw new Error("Invalid request method")
    }

    // TODO add auth
    // const userInfo = await getUserInfo(req.headers.authorization)

    const email = req.query.email as string | undefined
    if (!email) {
      throw new Error("No email provided")
    }

    let active = false
    if (isAdmin(email)) {
      active = true
    } else {
      const subscription = await getSubsciption(email)
      active = subscription?.status === "active"
    }

    return res.status(200).json({ active })
  } catch (error) {
    return res.status(401).json({ success: false, error: error.message })
  }
}