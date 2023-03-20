import type { PlasmoCSConfig } from "plasmo"
import { sendToBackground } from "@plasmohq/messaging"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_start"
}
window.addEventListener("message", async (event) => {
  // We only accept messages from ourselves
  if (event.source !== window) {
    return;
  }

  if (event.data.type) {
    console.log("Relay received: " + event.data.text);
    const response = await sendToBackground({
      name: event.data.type,
      body: {
        prompt: event.data.text
      }
    })

    window.postMessage({
      type: `${event.data.type}:response`,
      ...response
    }, "*");
  }
}, false);