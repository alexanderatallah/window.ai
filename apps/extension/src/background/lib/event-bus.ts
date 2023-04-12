import { ok } from "~core/utils/result-monad"
import { log } from "~core/utils/utils"
import type { EventType } from "~public-interface"

// TODO adapt to browser.runtime.Port
type Port = chrome.runtime.Port

export class EventBus {
  protected listeners: Set<Port>

  constructor() {
    this.listeners = new Set<Port>()
  }

  addListener(port: Port) {
    this.listeners.add(port)
  }

  dispatch(eventType: EventType, data: unknown) {
    this.listeners.forEach((port) => {
      log("Dispatching event", eventType, data, port)
      port.postMessage({
        response: ok({ event: eventType, data })
      })
    })
  }
}
