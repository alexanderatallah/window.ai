import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  world: "MAIN",
  all_frames: true,
  run_at: "document_start"
}

export const AI = {
  async generate(text: string): Promise<string> {
    window.postMessage({ type: "generate", text }, "*");

    return new Promise((resolve) => {
      window.addEventListener("message", (event) => {
        // We only accept messages from ourselves
        if (event.source !== window) {
          return;
        }

        if (event.data?.type === "generate:response") {
          console.log("Inject script received: ", event.data);
          resolve(event.data.completion);
        }
      }, false)
    })
  }
}

declare global {
  interface Window { ai: typeof AI; }
}
window.ai = AI
