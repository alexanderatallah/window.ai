import type { PlasmoCSConfig } from "plasmo"

import { ContentMessageType, PortName, PortResponse } from "~core/constants"
import { log } from "~core/utils"
import { Extension, type Port } from "~platforms/extension"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_start"
}

const windowPort = Extension.connectToPort(PortName.Window)

// Handle responses from background script
Extension.addPortListener<PortName.Window, PortResponse>(
  PortName.Window,
  (msg) => {
    const { id, response } = msg
    window.postMessage(
      {
        type: ContentMessageType.Response,
        portName: PortName.Window,
        id,
        response
      },
      "*"
    )
  },
  windowPort
)

// Handle requests from content script
window.addEventListener("message", (event) => {
  const { source, data } = event

  // We only accept messages our window and port
  if (source !== window || data?.portName !== PortName.Window) {
    return
  }

  const { type } = data

  switch (type) {
    case ContentMessageType.Request:
    case ContentMessageType.Cancel:
      log(`Relay received ${type}: `, data)
      Extension.sendMessage(data, windowPort)
      break
    case ContentMessageType.Response:
      // Handled by inpage script
      break
  }
})
