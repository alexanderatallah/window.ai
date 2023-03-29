import type { NextApiRequest, NextApiResponse } from "next"

import { ErrorCode } from "~core/constants"
import { err, ok } from "~core/utils/result-monad"

import { Response, getSubsciption, getUserInfo, isAdmin } from "./_common"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response<{ active: boolean }>>
) {
  if (req.method !== "GET" || !req.headers.authorization) {
    return res.status(400).json(err(ErrorCode.InvalidRequest))
  }

  let userInfo: { email: string }
  try {
    userInfo = await getUserInfo(req.headers.authorization)
  } catch (error) {
    console.error("Auth error: ", error)
    return res.status(401).json(err(ErrorCode.NotAuthenticated))
  }

  // if (isAdmin(userInfo.email)) {
  //   active = true
  // } else {
  const subscription = await getSubsciption(userInfo.email)
  const active = subscription?.status === "active"
  // }

  return res.status(200).json(ok({ active }))
}
