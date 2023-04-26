import { useEffect, useMemo, useState } from "react"
import { useArray } from "~core/components/hooks/useArray"
import { useWindowAI } from "~core/components/hooks/useWindowAI"
import {
  useAgentManager,
  type AgentConfig
} from "~core/providers/useAgentManager"
import { useLog } from "~features/agent/useLog"

const getSystemPrompt = (goal: string, ac: AgentConfig) =>
  `I am ${ac.name}, ${ac.description}. My purpose is to ${ac.purpose}. I am a member of a larger project whose goal is to ${goal}. We will be utilizing the OODA loop, going through each phase one by one after each of your message which will provide me with relevant input guidance.`

const getObservePrompt = () => ``

const getOrientPrompt = () => `
Taking all the data gathered in the observation phase, breaking it down deductively into its constituent parts and then recombining those parts through creative synthesis to form a new model of reality that lets you make better decisions and actions.
`

const getDecidePrompt = () => ``

const getActPrompt = () => ``

export enum OODAState {
  Idle = "Idling",
  Observe = "Observing",
  Orient = "Orienting",
  Decide = "Deciding",
  Act = "Acting",
  Blocked = "Blocked"
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

  // The feedback are gathered at each loop across each state, which will be used to inform the observation phase
  const feedback = useArray()

  const ai = useWindowAI(
    [
      {
        role: "assistant",
        content: getSystemPrompt(goal, agent)
      }
    ],
    {
      cacheSize: 25
    }
  )

  const observe = async () => {
    setState(OODAState.Observe)
    // Gather "contexts" to form an "observation"
    // Implicit Guidance & Control: use goal + agent purposes
    // Collecting internal feedback
    // Unfolding circumstances: use what other agents have found at the current time loop
    // Outside information: web search? news? social media? lookup?
    // Unfolding interaction with environment: ???

    // Can we skip the orient and decide phase to act right away?
    // Has the agent achieved "Intuitive Skill"?

    const observation = await ai.sendMessage(`
        Given the project's goal, your unique purpose, and the above contexts, what are the observation that you found based on the context above? SKIP PROMPT
    `)
    log.add("Observation:")
    log.add(observation?.message.content)
  }

  const orient = async () => {
    setState(OODAState.Orient)
    // Breaking down:
    // Analysis & Synthesis
    // Cultural traditions
    // Genetic heritage
    // New infomation
    // Previous experience
  }

  const decide = async () => {
    setState(OODAState.Decide)
  }

  const act = async () => {
    setState(OODAState.Act)
  }

  const cleanup = async () => {
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
      console.log("HERE?")

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
    log,
    runOODALoop
  }
}
