import type { NextApiRequest, NextApiResponse } from "next"

import { ErrorCode } from "~core/constants"
import { err, ok } from "~core/utils/result-monad"

import {
  Request,
  Response,
  authenticate,
  cohere,
  openai,
  together
} from "../_common"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
) {
  try {
    await authenticate(req)
  } catch (error) {
    console.error("Error authenticating: ", error)
    return res.status(401).json(err(ErrorCode.NotAuthenticated))
  }

  if (typeof req.body.prompt !== "string") {
    return res.status(400).json(err(ErrorCode.InvalidRequest))
  }

  const body = req.body as Request

  const text = await together.complete({
    prompt: body.prompt
  })
  return res.status(200).json(ok(text))
}
