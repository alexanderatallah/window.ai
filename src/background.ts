
import browser, { type Runtime } from 'webextension-polyfill'
import { CompletionResponse, PORT_NAME } from '~core/constants';
import { callAPI } from '~core/network';
import { log } from '~core/utils';

export { }

log("Background script loaded");
browser.runtime.onConnect.addListener((port: Runtime.Port) => {
  // Only accept our connections
  if (port.name !== PORT_NAME) {
    return;
  }

  log("Background received connection: ", port);

  port.onMessage.addListener(handleMessage);
})

async function handleMessage(event: any, port: Runtime.Port) {
  log("Background received message: ", event, port);

  const { id, message, type } = event;

  const result = await callAPI(
    "/api/model/call",
    {
      method: "POST"
    },
    {
      prompt: message.prompt
    }
  ) as CompletionResponse;

  port.postMessage(result);
}