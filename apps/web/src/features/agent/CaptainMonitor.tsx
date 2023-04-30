import { useAgentManager } from "~core/providers/agent-manager"
import { AgentMonitor } from "~features/agent/AgentMonitor"

export const CaptainMonitor = () => {
  const { captain, captainLog } = useAgentManager()

  return (
    <AgentMonitor
      name="Manager"
      purpose="Facilitate Primary Goal and Hiring new Agent"
      description="The Manager is responsible for facilitating the Primary Goal to come up with new agents to hire and evaluate the pool of agent."
      isThinking={captain.loading}
      messages={captainLog.messages}
    />
  )
}
