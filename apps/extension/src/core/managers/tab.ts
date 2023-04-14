import { BaseManager } from "./base"

export interface Tab {
  id: string
}

class TabManager extends BaseManager<Tab> {
  constructor() {
    super("tabs", "session")
  }

  init(tabId: number): Tab {
    return {
      id: tabId.toString()
    }
  }
}

export const tabManager = new TabManager()
