import browser from "webextension-polyfill"

import type { PortEvent, PortName } from "~core/constants"
import { log } from "~core/utils/utils"

export type Port = browser.Runtime.Port
export const Extension = {
  // Listen to incoming messages from a specific port name.
  // If we already have a preexisting port, just add the listener.
  // Then this method primarily helps with typing.
  addPortListener<PN extends PortName, PE extends PortEvent>(
    name: PN,
    listener: (message: PE[PN], port: Port) => void,
    port?: Port
  ) {
    if (port) {
      port.onMessage.addListener(listener)
      return
    }
    browser.runtime.onConnect.addListener((port) => {
      if (port.name === name) {
        port.onMessage.addListener(listener)
      }
    })
  },

  connectToPort(name: PortName, onDisconnect: () => void): Port {
    const port = browser.runtime.connect({ name })
    port.onDisconnect.addListener(() => {
      log("Disconnected from port")
      onDisconnect()
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
