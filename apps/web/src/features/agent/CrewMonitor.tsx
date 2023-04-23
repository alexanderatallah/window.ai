import { useMemo } from "react"
import { useAgentManager } from "~core/providers/useAgentManager"
import { AgentMonitor } from "~features/agent/AgentMonitor"

export const CrewMonitor = ({ id = "" }) => {
  const { getAgent } = useAgentManager()
  const agent = useMemo(() => getAgent(id), [id, getAgent])

  return (
    <AgentMonitor
      id={id}
      name={agent.name}
      purpose={agent.purpose}
      description={agent.description}
      messages={[]}
    />
  )
}
