import { InputMessage } from "~core/components/InputMessage"
import { useAgentManager } from "~core/providers/agent-manager"
import { AgentHiringCard } from "~features/agent/AgentHiringCard"
import { CaptainMonitor } from "~features/agent/CaptainMonitor"
import { CrewMonitor } from "~features/agent/CrewMonitor"
import dynamic from "next/dynamic"
import { useWebVM } from "~core/providers/web-vm"

const WebTerminal = dynamic(() => import("~features/web-vm/WebTerminal"), {
  ssr: false
})

// Create a screen writing mobile application with a novel UX that no one has seen before, ensure the design is great
export function AgentPlaygroundView() {
  const { run } = useWebVM()
  const { goal, setGoal, agentList } = useAgentManager()

  return (
    <div className="flex flex-row min-h-screen bg-slate-1 text-slate-11">
      <div className="flex flex-col w-2/3 p-8">
        <h2 className="text-2xl font-bold text-slate-11">Agent Playground</h2>
        <div className="flex">
          <InputMessage
            placeholder="Enter Primary Goal"
            buttonText="Set"
            defaultInput={goal}
            sendMessage={setGoal}
          />
        </div>

        <div className="flex flex-wrap w-full">
          <CaptainMonitor />
          <AgentHiringCard />
          {agentList.map((agent) => (
            <CrewMonitor key={agent.id} id={agent.id} />
          ))}
        </div>
      </div>
      <div className="flex flex-col w-1/3 p-8 bg-slate-2">
        <WebTerminal />
        <button
          onClick={() => {
            run("pnpm i")
          }}>
          Start Server
        </button>
      </div>
    </div>
  )
}
