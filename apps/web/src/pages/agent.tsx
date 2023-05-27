import { AgentManagerProvider } from "~demo/agent/agent-manager-provider"
import { WebVMProvider } from "~demo/web-vm/web-vm-provider"
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
