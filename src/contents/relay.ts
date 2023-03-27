import type { PlasmoCSConfig } from "plasmo"

import { ContentMessageType, PORT_NAME } from "~core/constants"
import { log } from "~core/utils"
import { Extension, type Port } from "~platforms/extension"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_start"
}

let _portSingleton: Port | undefined = undefined
function getPort(shouldReinitialize = false): Port {
  if (!_portSingleton || shouldReinitialize) {
    _portSingleton = Extension.connectToPort(PORT_NAME)
    _portSingleton.onDisconnect.addListener(() => {
      log("Disconnected from port")
    })
  }
  return _portSingleton
}

// Handle responses from background script
getPort().onMessage.addListener((msg) => {
  const { id, ...response } = msg
  window.postMessage(
    {
      type: ContentMessageType.Response,
      portName: PORT_NAME,
      id,
      response
    },
    "*"
  )
})

function postPortMessage(data: unknown) {
  try {
    getPort().postMessage(data)
  } catch (e) {
    log("Error posting message to port. Retrying ", e)
    getPort(true).postMessage(data)
  }
}

// Handle requests from content script
window.addEventListener("message", (event) => {
  const { source, data } = event

  // We only accept messages our window and port
  if (source !== window || data?.portName !== PORT_NAME) {
    return
  }

  const { type } = data

  switch (type) {
    case ContentMessageType.Request:
    case ContentMessageType.Cancel:
      log(`Relay received ${type}: `, data)
      postPortMessage(data)
      break
    case ContentMessageType.Response:
      // Handled by inpage script
      break
  }
})
