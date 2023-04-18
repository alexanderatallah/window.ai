import { ErrorCode, EventType } from "window.ai"

import type { PlasmoMessaging } from "@plasmohq/messaging"

import { EventBus } from "~background/lib/event-bus"
import type { PortRequest, PortResponse } from "~core/constants"
import { PortName } from "~core/constants"
import type { Result } from "~core/utils/result-monad"
import { err } from "~core/utils/result-monad"
import { log } from "~core/utils/utils"

export type EventRequest<T> = {
  shouldListen?: boolean
  event?: EventType
  data?: T
}
export type EventResponse<T> = Result<{ event: EventType; data: T }, ErrorCode>

const eventBus = new EventBus()

const handler: PlasmoMessaging.PortHandler<
  PortRequest[PortName.Events],
  PortResponse[PortName.Events]
> = async (req, res) => {
  log("Event port received message: ", req)

  if (!req.body) {
    return res.send(err(ErrorCode.InvalidRequest))
  }

  const { request, id } = req.body

  if (request.shouldListen) {
    if (!req.port?.sender?.tab?.id) {
      console.error("Bad sender", req.port)
      return res.send({ id, error: ErrorCode.InvalidRequest })
    }
    await eventBus.addListener(req.port.sender.tab.id)
    // We're adding a listener, no response needed
    return
  }

  const { event, data } = request
  if (event) {
    await eventBus.dispatch(event, data)
    // No response needed
    return
  }
}

export default handler
