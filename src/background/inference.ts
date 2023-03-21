
import browser from 'webextension-polyfill'
import { PORT_NAME } from '~core/constants';
browser.runtime.onConnect.addListener((port) => {
  console.assert(port.name === PORT_NAME);
  port.onMessage.addListener(async (msg) => {

    const result = await callAPI(
      "/api/model/call",
      {
        method: "POST"
      },
      {
        prompt: req.body.prompt
      }
    ) as { completion: string }

    res.send(result)
  });
})