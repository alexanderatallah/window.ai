import type { NextApiRequest, NextApiResponse } from "next"

import { ErrorCode } from "~core/constants"
import { err, ok } from "~core/utils/result-monad"

import { Response, getSubsciption, getUserInfo, isAdmin } from "./_common"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response<{ active: boolean }>>
) {
  if (req.method !== "GET") {
    res.status(400).json(err(ErrorCode.InvalidRequest))
  }

  try {
    const userInfo = await getUserInfo(req.headers.authorization)

    let active = false
    if (isAdmin(userInfo.email)) {
      active = true
    } else {
      const subscription = await getSubsciption(userInfo.email)
      active = subscription?.status === "active"
    }

    return res.status(200).json(ok({ active }))
  } catch (error) {
    console.error("Error checking subscription: ", error)
    return res.status(401).json(err(ErrorCode.NotAuthenticated))
  }
}
