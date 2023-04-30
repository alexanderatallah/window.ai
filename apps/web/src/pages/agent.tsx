import { AgentManagerProvider } from "~core/providers/agent-manager"
import { WebVMProvider } from "~core/providers/web-vm"
import { AgentPlaygroundView } from "~views/AgentPlaygroundView"

export default function AgentPlaygroundPage() {
  return (
    <WebVMProvider>
      <AgentManagerProvider>
        <AgentPlaygroundView />
      </AgentManagerProvider>
    </WebVMProvider>
  )
}
