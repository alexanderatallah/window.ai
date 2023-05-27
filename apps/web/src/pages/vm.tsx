import Head from "next/head"
import { WebVMProvider } from "~demo/web-vm/web-vm-provider"
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
