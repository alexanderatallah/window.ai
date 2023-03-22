import type { NextApiRequest, NextApiResponse } from "next"
import { StreamEvent } from "~core/models/model"
import { log } from "~core/utils";
import { authenticate, openai, Request, Response } from "../_common"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
) {
  try {
    await authenticate(req);
  } catch (error) {
    return res.status(401).json({ success: false, error: error.message })
  }

  log("Received on API: ", req.body);

  const body = JSON.parse(req.body.data) as Request
  if (typeof body.prompt !== "string") {
    throw new Error("Invalid prompt: " + req.body)
  }

  const stream = await openai.stream({
    prompt: body.prompt,
  })

  // Set up Server-Sent Events (SSE) headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Listen for data events
  stream.on(StreamEvent.Data, (chunk) => {
    res.write(chunk);
  });

  // Listen for error events
  stream.on(StreamEvent.Error, (err) => {
    // TODO: Handle error
    res.status(500).json({ success: false, error: err });
  });

  // Listen for end events
  stream.on(StreamEvent.End, () => {
    res.end();
  });
}
