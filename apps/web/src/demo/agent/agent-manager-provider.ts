import { createProvider } from "puro"
import { useCallback, useContext, useMemo, useState } from "react"
import extractJson from "@airthium/extract-json-from-string"
import { useWindowAI } from "~core/hooks/useWindowAI"
import { isMessageOutput } from "window.ai"

import { nanoid } from "nanoid"
import { useLog } from "~demo/agent/useLog"

export type AgentConfig = {
  name: string
  purpose: string
  description: string

  id?: string
  prompt?: string
}

type AgentPool = Record<string, AgentConfig>

const defaultGoal = `Build a habitable base on Mars`

const getCaptainSystemPrompt = (limit = 4) =>
  `You are a resourceful project manager who can break any complex problem into ${limit} subtasks, then come up with the description for an autonomous agent that could contribute usefully to each of those task.`

const getGoalPrompt = (goal: string, limit = 4) =>
  `SKIP PROMPT. Break the following goal into ${limit} core subtasks:
  
  ${goal}

  For each subtasks, come up with an autonomous agent specialized in a certain area that can contribute meaningfully to the task. Then supply your responses in the form of a valid JSON array, containing a list of agents. The following is an example of a valid response:

  [{ "name": "designer", "purpose": "Design the layout of the mobile application", "description": "A professional designer who can plan and describe the exact specification needed to build a mobile application." }]

  The JSON array response indicating the list of needed agent is:`

// Provide a brief description of all the available agents in the pool, except the captain
// Provide a pool of potential agents that can be hired that was suggested by either the captain or a crew
// Store progress of the current tasks
// Store most valuable output from all the agents thus far

// Maintain a list of potential agent to hire. This list can be suggested by either the captain's observation or the crew's suggestion
// Make a decision to either hire or fire a crew member
// Come up with new subtasks if all agents are idle

// store insights/research/output collected from agents
// store a message queue that other agent sent to a certain agent (or the captain itself)
export const useAgentManagerProvider = () => {
  const [keyInsights, setKeyInsights] = useState<string[]>([])

  const [hiringSuggestions, setHiringSuggestions] = useState<string[]>([])

  const [agentPool, setAgentPool] = useState<AgentPool>({})

  const agentList = useMemo(() => Object.values(agentPool), [agentPool])

  const captain = useWindowAI([
    {
      role: "system",
      content: getCaptainSystemPrompt()
    }
  ])

  const captainLog = useLog()

  const [goal, _setGoal] = useState(defaultGoal)

  const setGoal = async (_goal: string) => {
    _setGoal(_goal)
    setAgentPool({})

    captainLog.add(`Goal set: "${_goal}"`)

    const goalPrompt = getGoalPrompt(_goal)
    const resp = await captain.sendMessage(goalPrompt)

    if (!resp) {
      return
    }

    if (isMessageOutput(resp)) {
      const newAgentList = extractJson(
        resp.message.content
      )?.[0] as AgentConfig[]

      if (newAgentList) {
        captainLog.add(`Recruiting:`)
        newAgentList.forEach((agent) => {
          captainLog.add(`- ${agent.name}`)
        })

        setAgentPool(
          newAgentList.reduce((acc, agentConfig: AgentConfig) => {
            const id = nanoid()
            agentConfig.id = id
            acc[id] = agentConfig
            return acc
          }, {} as AgentPool)
        )
      }
    }
  }

  const getAgent = useCallback(
    (id: string) => {
      return agentPool[id]
    },
    [agentPool]
  )

  const addAgent = useCallback((agent: AgentConfig) => {
    const id = nanoid()
    agent.id = id
    setAgentPool((prev) => ({ ...prev, [id]: agent }))
    return id
  }, [])

  const removeAgent = useCallback((id: string) => {
    setAgentPool((prev) => {
      const { [id]: _, ...rest } = prev
      return rest
    })
  }, [])

  const addInsight = useCallback((insight: string) => {
    setKeyInsights((prev) => [...prev, insight])
  }, [])

  const removeInsight = useCallback((insight: string) => {
    setKeyInsights((prev) => prev.filter((i) => i !== insight))
  }, [])

  const suggestHire = useCallback((agentDescription: string) => {
    setHiringSuggestions((prev) => [...prev, agentDescription])
  }, [])

  return {
    agentList,
    getAgent,
    addAgent,
    removeAgent,
    captain,
    captainLog,
    goal,
    setGoal,

    keyInsights,
    addInsight,
    removeInsight,
    suggestHire
  }
}

const { BaseContext, Provider } = createProvider(useAgentManagerProvider)

export const AgentManagerProvider = Provider
export const useAgentManager = () => useContext(BaseContext)
