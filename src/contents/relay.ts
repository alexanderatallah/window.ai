import type { PlasmoCSConfig } from "plasmo"

import { ContentMessageType, PortName, PortResponse } from "~core/constants"
import { log } from "~core/utils/utils"
import { Extension, type Port } from "~platforms/extension"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_start"
}

const ports = {
  [PortName.Completion]: Extension.connectToPort(PortName.Completion),
  [PortName.Model]: Extension.connectToPort(PortName.Model)
}

// Handle responses from background script
Extension.addPortListener<PortName.Completion, PortResponse>(
  PortName.Completion,
  (msg) => {
    if (!("response" in msg)) {
      // TODO handle invalid requests
      throw `Invalid request: ${msg}`
    }
    const { id, response } = msg
    window.postMessage(
      {
        type: ContentMessageType.Response,
        portName: PortName.Completion,
        id,
        response
      },
      "*"
    )
  },
  ports[PortName.Completion]
)

Extension.addPortListener<PortName.Model, PortResponse>(
  PortName.Model,
  (msg) => {
    if (!("response" in msg)) {
      // TODO handle invalid requests
      throw `Invalid request: ${msg}`
    }
    const { id, response } = msg
    window.postMessage(
      {
        type: ContentMessageType.Response,
        portName: PortName.Model,
        id,
        response
      },
      "*"
    )
  },
  ports[PortName.Model]
)

// Handle requests from content script
window.addEventListener("message", (event) => {
  const { source, data } = event

  // We only accept messages our window and a port
  if (source !== window || !data.portName) {
    return
  }

  const { type } = data

  switch (type) {
    case ContentMessageType.Request:
    case ContentMessageType.Cancel:
      log(`Relay received ${type}: `, data)
      Extension.sendMessage(
        data,
        ports[data.portName as PortName.Model | PortName.Completion]
      )
      break
    case ContentMessageType.Response:
      // Handled by inpage script
      break
  }
})
