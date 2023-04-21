import { createProvider } from "puro"
import { useContext, useState } from "react"
import { useWindowAI } from "~core/components/hooks/useWindowAI"

type AgentConfig = {
  id: string
  name: string
  purpose: string
}

export const useAgentManagerProvider = () => {
  const [agentPool, setAgentPool] = useState<AgentConfig[]>([])
  const managerAI = useWindowAI([])

  return {
    managerAI,
    agentPool,
    setAgentPool
  }
}

const { BaseContext, Provider } = createProvider(useAgentManagerProvider)

export const AgentManagerProvider = Provider
export const useAgentManager = () => useContext(BaseContext)
