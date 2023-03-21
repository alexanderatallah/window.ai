
import browser, { type Runtime } from 'webextension-polyfill'
import type { CompletionResponse } from '~core/constants';
import { callAPI } from '~core/network';
import { log } from '~core/utils';

export { }

log("Background script loaded");
browser.runtime.onConnect.addListener((port: Runtime.Port) => {
  log("Background received connection: ", port);

  port.onMessage.addListener(handleRequest);
})

async function handleRequest(event: any, port: Runtime.Port) {
  log("Background received message: ", event, port);

  const { id, request } = event;

  const result = await callAPI(
    "/api/model/call",
    {
      method: "POST"
    },
    {
      prompt: request.prompt
    }
  ) as CompletionResponse;

  port.postMessage({ ...result, id });
}