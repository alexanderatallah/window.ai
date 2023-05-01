import { WebPreview } from "~features/web-vm/WebPreview"

import dynamic from "next/dynamic"

const WebTerminal = dynamic(
  () => import("~features/web-vm/WebTerminal").then((m) => m.WebTerminal),
  {
    ssr: false
  }
)

// Create a screen writing mobile application with a novel UX that no one has seen before, ensure the design is great
export function AIContainerView() {
  return (
    <div className="flex flex-row h-screen bg-slate-1 text-slate-11 p-8 gap-4">
      <div className="flex flex-col w-2/3 h-full gap-2">
        <h2 className="text-2xl font-bold text-slate-12">AI Container</h2>
        <WebTerminal />
      </div>
      <div className="flex w-1/3 h-full">
        <WebPreview />
      </div>
    </div>
  )
}
