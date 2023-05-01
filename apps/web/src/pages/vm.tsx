import { WebVMProvider } from "~core/providers/web-vm"
import { AIContainerView } from "~views/AIContainerView"

export default function AIContainerPage() {
  return (
    <WebVMProvider>
      <AIContainerView />
    </WebVMProvider>
  )
}
