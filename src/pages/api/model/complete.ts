import type { NextApiRequest, NextApiResponse } from "next"

import { ErrorCode } from "~core/constants"
import { LLM } from "~core/managers/config"
import { err, ok } from "~core/utils/result-monad"

import { Request, Response, authenticate, externalModels } from "../_common"

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

  const modelId = req.body.modelId || LLM.GPT3
  const model = externalModels[modelId as keyof typeof externalModels]

  if (!model) {
    return res.status(400).json(err(ErrorCode.InvalidRequest))
  }

  const body = req.body as Request
  // TODO use req.body.modelUrl too

  const text = await model.complete(body.input, {
    apiKey: body.apiKey
  })
  return res.status(200).json(ok(text))
}
