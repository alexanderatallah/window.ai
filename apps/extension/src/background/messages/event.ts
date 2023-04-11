import type { PlasmoMessaging } from "@plasmohq/messaging"

import { EventBus } from "~background/lib/event-bus"
import { ErrorCode, EventType } from "~public-interface"

const eventBus = new EventBus()

const handler: PlasmoMessaging.MessageHandler<{
  event: EventType
  data: object
}> = async (req, res) => {
  if (!req.body || !req.body.event) {
    return res.send({
      error: ErrorCode.InvalidRequest
    })
  }
  const { event, data } = req.body
  eventBus.dispatch(event, data)
  // No response needed
}

export function addEventListener(port: chrome.runtime.Port) {
  eventBus.addListener(port)
}

export default handler
