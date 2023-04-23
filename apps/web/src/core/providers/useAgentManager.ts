import { createProvider } from "puro"
import { useContext, useState } from "react"
import extractJson from "@airthium/extract-json-from-string"
import { useWindowAI } from "~core/components/hooks/useWindowAI"
import { isMessageOutput } from "window.ai"

type AgentConfig = {
  id: string
  name: string
  purpose: string
}

const getCaptainSystemPrompt = (limit = 4) =>
  `You are a resourceful project manager who can break any complex problem into ${limit} subtasks, then came up with the description for an autonomous agent that could contribute usefully to each of those task.`

const getGoalPrompt = (goal: string, limit = 4) =>
  `SKIP PROMPT. Break the following goal into ${limit} core subtasks:
  
  ${goal}

  For each subtasks, come up with an autonomous agent specialized in a certain area that can contribute meaningfully to the task. Then supply your responses in the form of a valid JSON array, containing a list of agents. The following is an example of a valid response:
      
  [{ "id": "abc", "name": "designer", "purpose": "Design the layout of the mobile application" }]

  The JSON array response indicating the list of needed agent is:`

// Provide a brief description of all the available agents in the pool, except the captain
// Provide a pool of potential agents that can be hired that was suggested by either the captain or a crew
// Store progress of the current tasks
// Store most valuable output from all the agents thus far

// Maintain a list of potential agent to hire. This list can be suggested by either the captain's observation or the crew's suggestion
// Make a decision to either hire or fire a crew member
// Come up with new subtasks if all agents are idle
export const useAgentManagerProvider = () => {
  const [agentPool, setAgentPool] = useState<AgentConfig[]>([])
  const captain = useWindowAI([
    {
      role: "system",
      content: getCaptainSystemPrompt()
    }
  ])

  const setGoal = async (goal: string) => {
    const goalPrompt = getGoalPrompt(goal)
    const resp = await captain.sendMessage(goalPrompt)

    if (isMessageOutput(resp!)) {
      const newAgentPool = extractJson(resp.message.content)
      console.log(newAgentPool)
    }
  }

  return {
    captain,
    agentPool,
    setGoal
  }
}

const { BaseContext, Provider } = createProvider(useAgentManagerProvider)

export const AgentManagerProvider = Provider
export const useAgentManager = () => useContext(BaseContext)
