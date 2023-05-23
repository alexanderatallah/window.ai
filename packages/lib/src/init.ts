// Checking against other window.ai implementations
export function hasWindowAI() {
  return typeof globalThis.window.ai?.generateText === "function"

  // Ref: https://github.com/alexanderatallah/window.ai/pull/34#discussion_r1170544209
  // return (
  //   !!globalThis.window.ai?.__window_ai_metadata__ &&
  //   window.ai.__window_ai_metadata__.domain === VALID_DOMAIN
  // )
}

const DEFAULT_WAIT_OPTIONS = {
  interval: 100,
  timeout: 2_400 // https://github.com/alexanderatallah/window.ai/pull/34#discussion_r1170545022
}

export async function waitForWindowAI(opts = DEFAULT_WAIT_OPTIONS) {
  if (hasWindowAI()) {
    return
  }

  await new Promise((resolve, reject) => {
    let counter = 0
    const timerInterval = setInterval(() => {
      counter += opts.interval
      if (counter > opts.timeout) {
        clearInterval(timerInterval)
        reject(new Error("window.ai not found"))
      }

      if (hasWindowAI()) {
        clearInterval(timerInterval)
        resolve(true)
      }
    }, opts.interval)
  })
}

export const getWindowAI = async (opts = DEFAULT_WAIT_OPTIONS) => {
  // wait until the window.ai object is available
  await waitForWindowAI(opts)
  return globalThis.window.ai
}
