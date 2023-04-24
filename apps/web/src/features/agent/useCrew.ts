import { useEffect, useMemo, useState } from "react"
import { useWindowAI } from "~core/components/hooks/useWindowAI"
import {
  useAgentManager,
  type AgentConfig
} from "~core/providers/useAgentManager"
import { useLog } from "~features/agent/useLog"

const getSystemPrompt = (goal: string, ac: AgentConfig) =>
  `I am ${ac.name}, ${ac.description}. My purpose is to ${ac.purpose}. I am a member of a larger project whose goal is to ${goal}.`

const getObservePrompt = () => ``

const getOrientPrompt = () => `
Taking all the data gathered in the observation phase, breaking it down deductively into its constituent parts and then recombining those parts through creative synthesis to form a new model of reality that lets you make better decisions and actions.
`

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
export const useCrew = ({ id = "", loopLimit = 4, interval = 4200 }) => {
  const log = useLog()
  const [state, setState] = useState(OODAState.Idle)
  const { goal, getAgent } = useAgentManager()

  const agent = useMemo(() => getAgent(id), [id])

  const ai = useWindowAI([
    {
      role: "assistant",
      content: getSystemPrompt(goal, agent)
    }
  ])

  async function observe() {
    log.add("Observing:")
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
      while (isMounted && loopCount < loopLimit) {
        await Promise.race([runOODALoop(), delay(interval)])
        loopCount++
      }
    }

    loop()

    return () => {
      isMounted = false
    }
  }, [interval, loopLimit])

  return {
    agent,
    state,
    runOODALoop
  }
}
