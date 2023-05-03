import Head from "next/head"
import { WebVMProvider } from "~core/providers/web-vm"
import { AIContainerView } from "~views/AIContainerView"

export default function AIContainerPage() {
  return (
    <WebVMProvider>
      <Head>
        <title>AI Container</title>
      </Head>
      <AIContainerView />
    </WebVMProvider>
  )
}
