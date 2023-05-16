import { AgentManagerProvider } from "~features/agent/agent-manager-provider"
import { WebVMProvider } from "~features/web-vm/web-vm-provider"
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
