import { useEffect, useMemo, useState } from "react"
import { useArrayRef } from "~core/hooks/useArrayRef"
import { useWindowAI } from "~core/hooks/useWindowAI"
import {
  useAgentManager,
  type AgentConfig
} from "~features/agent/agent-manager-provider"
import { useLog } from "~features/agent/useLog"

const getSystemPrompt = (goal: string, ac: AgentConfig) =>
  `I am ${ac.name}, ${ac.description}. My purpose is to ${ac.purpose}. I am a member of a larger project whose goal is to ${goal}. We will be utilizing the OODA loop, going through each phase one by one after each of your message which will provide me with relevant input guidance.`

const getObservePrompt = () => ``

const getOrientPrompt = () => ``

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
  const feedback = useArrayRef()
  const observations = useArrayRef()
  const potentialActions = useArrayRef()

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

    const resp = await ai.sendMessage(`SKIP PROMPT.
Feedbacks from previous loop:

  ${feedback.toString() || "NONE"}

Given the project's goal, your unique purpose, and the above contexts, what is your output for the observe phase? What is your observation? You must be concise, and response with just a list of bullet points.`)
    log.add("Observation >")
    log.add(resp?.message.content)
    observations.addAll(resp?.message.content.split("\n"))
  }

  const orient = async () => {
    setState(OODAState.Orient)
    // Breaking down:
    // Analysis & Synthesis
    // Cultural traditions
    // Genetic heritage
    // New infomation
    // Previous experience

    const resp = await ai.sendMessage(`SKIP PROMPT.
What is your output for the orientation phase? Breaking down:

  - Analysis & Synthesis
  - Cultural traditions
  - Genetic heritage
  - New infomation
  - Previous experience

deductively into its constituent parts and then recombining those parts through creative synthesis to form a new model of reality. You must be concise, and response with just a list of bullet points.`)
    log.add("Orientation >")
    log.add(resp?.message.content)
  }

  const decide = async () => {
    setState(OODAState.Decide)

    const resp = await ai.sendMessage(`SKIP PROMPT.
What is your output for the decide phase? Please suggest a list of potential actions ranked by their importance or effectiveness, with the most important or effective action at the top of the list. You must be concise, and response with just a list of bullet points.`)

    log.add("Decide >")
    log.add(resp?.message.content)
    potentialActions.addAll(resp?.message.content.split("\n"))
  }

  const act = async () => {
    setState(OODAState.Act)
    const resp = await ai.sendMessage(`SKIP PROMPT.
    What is your output for the act phase? What action will you be taking now? Simulate the output of this action as if it was executed in the real world. You must be concise, and response with just a list of bullet points.`)

    log.add("Act >")
    log.add(resp?.message.content)
    feedback.addAll(resp?.message.content.split("\n"))
  }

  const cleanup = async () => {
    // Figure out which feedback, observation, and potential actions should be cleanedup based on the current state?

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
    if (!ai.isReady) {
      return
    }

    let isMounted = true
    let loopCount = 0

    const loop = async () => {
      while (isMounted && loopCount < loopLimit) {
        await Promise.all([runOODALoop(), delay(interval)])
        loopCount++
      }
    }

    loop()

    return () => {
      isMounted = false
      log.clear()
      observations.clear()
    }
  }, [interval, loopLimit, ai.isReady])

  return {
    agent,
    state,
    log,
    runOODALoop
  }
}
