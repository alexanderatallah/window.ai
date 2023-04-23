import { AgentManagerProvider } from "~core/providers/useAgentManager"
import { AgentPlaygroundView } from "~views/AgentPlaygroundView"

export default function AgentPlaygroundPage() {
  return (
    <AgentManagerProvider>
      <AgentPlaygroundView />
    </AgentManagerProvider>
  )
}
