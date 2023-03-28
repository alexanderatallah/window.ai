import type { NextApiRequest, NextApiResponse } from "next"

import { ErrorCode } from "~core/constants"
import { err, ok } from "~core/utils/result-monad"

import { Request, Response, authenticate, openai } from "../_common"

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

  const body = req.body as Request
  if (typeof body.prompt !== "string") {
    throw new Error("Invalid prompt: " + req.body)
  }

  const text = await openai.complete({
    prompt: body.prompt
  })
  return res.status(200).json(ok(text))
}
