import { sendToBackground } from "@plasmohq/messaging"

import { ok } from "~core/utils/result-monad"
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

  async dispatch(eventType: EventType, data: object) {
    this.listeners.forEach((port) => {
      port.postMessage({
        response: ok({ event: eventType, data })
      })
    })
  }
}
