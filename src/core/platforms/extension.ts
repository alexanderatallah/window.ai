import browser from "webextension-polyfill"

export type Port = browser.Runtime.Port
export const Extension = {
  reload() {
    browser.runtime.reload()
  },

  addPortListener(listener: (port: Port) => void) {
    browser.runtime.onConnect.addListener(listener)
  },

  connectToPort(name: string): Port {
    return browser.runtime.connect({ name })
  },

  async openTab(options) {
    const newTab = await browser.tabs.create(options)
    return newTab
  },

  async openWindow(options) {
    const newWindow = await browser.windows.create(options)
    return newWindow
  },

  async focusWindow(windowId) {
    await browser.windows.update(windowId, { focused: true })
  },

  async updateWindowPosition(windowId, left, top) {
    await browser.windows.update(windowId, { left, top })
  },

  async getLastFocusedWindow() {
    const windowObject = await browser.windows.getLastFocused()
    return windowObject
  },

  async closeCurrentWindow() {
    const windowDetails = await browser.windows.getCurrent()
    browser.windows.remove(windowDetails.id)
  },

  addOnRemovedListener(listener) {
    browser.windows.onRemoved.addListener(listener)
  },

  async getAllWindows() {
    const windows = await browser.windows.getAll()
    return windows
  },

  async getActiveTabs() {
    const tabs = await browser.tabs.query({ active: true })
    return tabs
  },

  async currentTab() {
    const tab = await browser.tabs.getCurrent()
    return tab
  },

  async switchToTab(tabId) {
    const tab = await browser.tabs.update(tabId, { highlighted: true })
    return tab
  },

  async closeTab(tabId) {
    await browser.tabs.remove(tabId)
  }
}
