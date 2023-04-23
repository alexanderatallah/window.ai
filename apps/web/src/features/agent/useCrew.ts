import { useEffect, useState } from "react"
import { useWindowAI } from "~core/components/hooks/useWindowAI"

const getSystemPrompt = () => ``

const getObservePrompt = () => ``

const getOrientPrompt = () => ``

const getDecidePrompt = () => ``

const getActPrompt = () => ``

export enum OODAState {
  Idle = "idle",
  Observe = "observe",
  Orient = "orient",
  Decide = "decide",
  Act = "act",
  Blocked = "blocked"
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// A crew implements the OODA loop
// Crew has access to the agent pool
// Crew can propose that a new agent should be hired
// Crew are spawn autonomously, will have a runtime, and will communicate back its result to the agentManager at each action
export const useCrew = ({ limit = 4, interval = 4200 }) => {
  const [state, setState] = useState(OODAState.Idle)
  const ai = useWindowAI([
    {
      role: "system",
      content: ""
    }
  ])

  async function observe() {
    setState(OODAState.Observe)
  }

  async function orient() {
    setState(OODAState.Orient)
  }

  async function decide() {
    setState(OODAState.Decide)
  }

  async function act() {
    setState(OODAState.Act)
  }

  async function cleanup() {
    setState(OODAState.Idle)
  }

  async function runOODALoop() {
    await observe()
    await orient()
    await decide()
    await act()
    await cleanup()
  }

  useEffect(() => {
    let isMounted = true
    let loopCount = 0

    const loop = async () => {
      while (isMounted && loopCount < limit) {
        await Promise.race([runOODALoop(), delay(interval)])
        loopCount++
      }
    }

    loop()

    return () => {
      isMounted = false
    }
  }, [interval, limit])

  return {
    state,
    runOODALoop
  }
}
