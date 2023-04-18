import type { EventType } from "window.ai"

import { Extension } from "~core/extension"
import { tabManager } from "~core/managers/tab"
import { ok } from "~core/utils/result-monad"
import { log } from "~core/utils/utils"

const MAX_TABS_TO_NOTIFY = 100

export class EventBus {
  async addListener(tabId: number) {
    const tab = tabManager.init(tabId)
    await tabManager.save(tab)
  }

  async dispatch(eventType: EventType, data: unknown) {
    const tabs = await tabManager.getIds(MAX_TABS_TO_NOTIFY)
    tabs.forEach((tabId) => {
      log("Dispatching event", eventType, data, tabId)
      Extension.sendToTab(parseInt(tabId), {
        response: ok({ event: eventType, data })
      })
    })
  }
}
