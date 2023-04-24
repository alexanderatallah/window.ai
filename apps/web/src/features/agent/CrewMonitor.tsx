import { useMemo } from "react"
import { useAgentManager } from "~core/providers/useAgentManager"
import { AgentMonitor } from "~features/agent/AgentMonitor"
import { useCrew } from "~features/agent/useCrew"

export const CrewMonitor = ({ id = "" }) => {
  const { agent } = useCrew({ id })

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
