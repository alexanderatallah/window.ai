import { AgentManagerProvider } from "~core/providers/useAgentManager"
import { PlaygroundView } from "~views/PlaygroundView"

export default function PlaygroundPage() {
  return (
    <AgentManagerProvider>
      <PlaygroundView />
    </AgentManagerProvider>
  )
}
