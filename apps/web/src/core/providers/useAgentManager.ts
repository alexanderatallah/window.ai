import { createProvider } from "puro"
import { useContext, useState } from "react"

type AgentConfig = {
  id: string

  name: string

  purpose: string
}

export const useAgentManagerProvider = () => {
  const [agentPool, setAgentPool] = useState<AgentConfig[]>([])

  return {
    agentPool,
    setAgentPool
  }
}

const { BaseContext, Provider } = createProvider(useAgentManagerProvider)

export const AgentManagerProvider = Provider
export const useAgentManager = () => useContext(BaseContext)
