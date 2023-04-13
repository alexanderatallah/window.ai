import browser from "webextension-polyfill"

import type {
  PortEvent,
  PortName,
  PortRequest,
  PortResponse
} from "~core/constants"
import { log } from "~core/utils/utils"

export type Port = browser.Runtime.Port
export const Extension = {
  // Listen to incoming messages from a specific port name.
  // If name is undefined, listen to incoming tab messages.
  addPortListener<PN extends PortName, PE extends PortEvent>(
    listener: (message: PE[PN], port: Port) => void,
    port?: Port
  ) {
    if (port) {
      port.onMessage.addListener(listener)
    } else {
      browser.runtime.onConnect.addListener((port) => {
        port.onMessage.addListener(listener)
      })
    }
  },

  connectToBackground(name: PortName, onDisconnect?: () => void): Port {
    const port = browser.runtime.connect({ name })
    port.onDisconnect.addListener(() => {
      log("Disconnected from port", name)
      onDisconnect && onDisconnect()
    })
    return port
  },

  connectToTab(tabId: number, onDisconnect?: () => void): Port {
    const port = browser.tabs.connect(tabId)
    port.onDisconnect.addListener(() => {
      console.info("Disconnected from tab", tabId)
      onDisconnect && onDisconnect()
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
    port: Port,
    wrapBody = true
  ) {
    port.postMessage(wrapBody ? { body: data } : data)
  },

  // Convenience method for firing a one-time message to background.
  // Like plasmo's sendToBackground
  sendRequest<PN extends PortName, PR extends PortRequest>(
    portName: PortName,
    data: PR[PN]
  ) {
    Extension.sendMessage<PN, PR>(data, Extension.connectToBackground(portName))
  },

  // Convenience method for firing a one-time message to a tab.
  sendResponse<PN extends PortName, PR extends PortResponse>(
    tabId: number,
    data: PR[PN]
  ) {
    Extension.sendMessage<PN, PR>(data, Extension.connectToTab(tabId), false)
  },

  async openPopup(
    width: number,
    height: number,
    params?: Record<string, string>
  ): Promise<browser.Windows.Window> {
    let left = 0
    let top = 0
    try {
      const lastFocused = await Extension.getLastFocusedWindow()
      // Position window in top right corner of lastFocused window.
      top = lastFocused.top || 0
      left = (lastFocused.left || 0) + ((lastFocused.width || width) - width)
    } catch (_) {
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

    // Fix Firefox issue where top/left are only respected on update
    if (popup.id && popup.left !== left && popup.state !== "fullscreen") {
      await Extension.updateWindowPosition(popup.id, left, top)
    }
    return popup
  },

  async updateWindowPosition(windowId: number, left: number, top: number) {
    await browser.windows.update(windowId, { left, top })
  },

  async openWindow(
    options: browser.Windows.CreateCreateDataType
  ): Promise<browser.Windows.Window> {
    const newWindow = await browser.windows.create(options)
    return newWindow
  },

  async getLastFocusedWindow() {
    const windowObject = await browser.windows.getLastFocused()
    return windowObject
  },

  async closeWindow(windowId: number) {
    return browser.windows.remove(windowId)
  },

  addOnRemovedListener(windowId: number, handler: () => void) {
    const onRemovedListener = (removedWindowId: number) => {
      if (removedWindowId === windowId) {
        browser.windows.onRemoved.removeListener(onRemovedListener)
        handler()
      }
    }
    browser.windows.onRemoved.addListener(onRemovedListener)
  }
}
