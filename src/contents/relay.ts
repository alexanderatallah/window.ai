import type { PlasmoCSConfig } from "plasmo"
import { ContentMessageType, PORT_NAME } from "~core/constants"
import browser, { type Runtime } from 'webextension-polyfill'
import { log } from "~core/utils";

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_start"
}

let _portSingleton: Runtime.Port | undefined = undefined
function getPort(): Runtime.Port {
  if (!_portSingleton) {
    _portSingleton = browser.runtime.connect({ name: PORT_NAME });
  }
  return _portSingleton;
}

// Handle responses from background script
getPort().onMessage.addListener((msg) => {
  window.postMessage({
    type: ContentMessageType.Response,
    response: msg
  }, "*");
});

// Handle requests from content script
window.addEventListener('message', (event) => {
  const { source, data } = event;

  // We only accept messages our window and port 
  if (source !== window || data?.portName !== PORT_NAME) {
    return
  }

  const { type } = data;

  if (type !== ContentMessageType.Response) {
    getPort().postMessage(data);
  }

  log("Relay received message: ", event);
});
