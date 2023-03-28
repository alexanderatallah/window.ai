import browser from "webextension-polyfill"

import type {
  PortEvent,
  PortName,
  PortRequest,
  PortResponse
} from "~core/constants"
import { log } from "~core/utils"

export type Port = browser.Runtime.Port
export const Extension = {
  addPortListener<PN extends PortName, PE extends PortEvent>(
    name: PN,
    listener: (message: PE[PN], port: Port) => void,
    port?: Port
  ) {
    if (port) {
      // We have a preexisting port, so just add the listener.
      // This method primarily helps with typing
      port.onMessage.addListener(listener)
      return
    }
    browser.runtime.onConnect.addListener((port) => {
      if (port.name === name) {
        port.onMessage.addListener(listener)
      }
    })
  },

  // NOTE: Passing in a tabId is tricky to get right,
  // because sometimes the tab is not ready to receive port connections,
  // and sometimes there's nothing listening on the other end yet
  connectToPort(name: PortName, tabId?: number): Port {
    const port = tabId
      ? browser.tabs.connect(tabId, { name })
      : browser.runtime.connect({ name })
    port.onDisconnect.addListener(() => {
      log("Disconnected from port")
    })
    return port
  },

  async getPortMessage<PN extends PortName, PE extends PortEvent>(
    port: Port
  ): Promise<PE[PN]> {
    return new Promise((resolve, reject) => {
      port.onMessage.addListener((event: PE[PN]) => {
        resolve(event)
      })
      port.onDisconnect.addListener((p) => {
        reject("Port disconnected: " + (p.error?.message || "unknown error"))
      })
    })
  },

  sendMessage<PN extends PortName, PE extends PortEvent>(
    data: PE[PN],
    port: Port
  ) {
    port.postMessage({ body: data })
    // TODO see if try/catch is necessary here:
    // try {
    //     getPort().postMessage({ body: data })
    //   } catch (e) {
    //     log("Error posting message to port. Retrying ", e)
    //     getPort(true).postMessage({ body: data })
    //   }
  },

  async openPopup(
    width: number,
    height: number,
    params?: Record<string, string>
  ): Promise<browser.Windows.Window> {
    // this._popupId = currentPopupId;
    // this._setCurrentPopupId = setCurrentPopupId;
    // const popup = await this._getPopup(currentPopupId);
    // // Bring focus to chrome popup
    // if (popup) {
    //   // TODO bring focus to existing chrome popup
    //   await this.platform.focusWindow(popup.id);
    // } else {
    // create new notification popup
    let left = 0
    let top = 0
    try {
      const lastFocused = await Extension.getLastFocusedWindow()
      // Position window in top right corner of lastFocused window.
      top = lastFocused.top
      left = lastFocused.left + (lastFocused.width - width)
    } catch (_) {
      // The following properties are more than likely 0, due to being
      // opened from the background chrome process for the extension that
      // has no physical dimensions
      const { screenX, screenY, outerWidth } = window
      top = Math.max(screenY, 0)
      left = Math.max(screenX + (outerWidth - width), 0)
    }

    const queryString = params
      ? "?" + new URLSearchParams(params).toString()
      : ""

    const popup = await Extension.openWindow({
      url: "popup.html" + queryString,
      type: "popup",
      width,
      height,
      left,
      top
    })

    // According to MetaMask codebase, Firefox currently ignores left/top for create,
    // but it works for update
    if (popup.left !== left && popup.state !== "fullscreen") {
      await Extension.updateWindowPosition(popup.id, left, top)
    }
    // pass new created popup window id to appController setter
    // and store the id to private variable this._popupId for future access
    // this._setCurrentPopupId(popup.id)
    // this._popupId = popup.id
    return popup
  },

  // Warning: Not all methods below are used yet or tested

  reload() {
    browser.runtime.reload()
  },

  async openTab(options: browser.Tabs.CreateCreatePropertiesType) {
    const newTab = await browser.tabs.create(options)
    return newTab
  },

  async openWindow(
    options: browser.Windows.CreateCreateDataType
  ): Promise<browser.Windows.Window> {
    const newWindow = await browser.windows.create(options)
    return newWindow
  },

  async focusWindow(windowId: number) {
    await browser.windows.update(windowId, { focused: true })
  },

  async updateWindowPosition(windowId: number, left: number, top: number) {
    await browser.windows.update(windowId, { left, top })
  },

  async getLastFocusedWindow() {
    const windowObject = await browser.windows.getLastFocused()
    return windowObject
  },

  async closeWindow(windowId: number) {
    return browser.windows.remove(windowId)
  },

  async closeCurrentWindow() {
    const windowDetails = await browser.windows.getCurrent()
    browser.windows.remove(windowDetails.id)
  },

  addOnRemovedListener(windowId: number, handler: () => void) {
    const onRemovedListener = (removedWindowId: number) => {
      if (removedWindowId === windowId) {
        browser.windows.onRemoved.removeListener(onRemovedListener)
        handler()
      }
    }
    browser.windows.onRemoved.addListener(onRemovedListener)
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

  async switchToTab(tabId: number) {
    const tab = await browser.tabs.update(tabId, { active: true })
    return tab
  },

  async closeTab(tabId: number) {
    await browser.tabs.remove(tabId)
  },

  // Waits for a tab to be loaded
  async _waitForTabReady(tabId: number): Promise<void> {
    const tab = await browser.tabs.get(tabId)
    if (tab.status === "complete") {
      return
    }
    return new Promise((resolve) => {
      const onTabUpdated = (
        updatedTabId: number,
        changeInfo: browser.Tabs.OnUpdatedChangeInfoType
      ) => {
        if (updatedTabId === tabId && changeInfo.status === "complete") {
          browser.tabs.onUpdated.removeListener(onTabUpdated)
          resolve()
        }
      }
      browser.tabs.onUpdated.addListener(onTabUpdated)
    })
  }
}
