import { InputMessage } from "~core/components/InputMessage"
import { useAgentManager } from "~core/providers/useAgentManager"
import { CaptainMonitor } from "~features/agent/CaptainMonitor"
import { CrewMonitor } from "~features/agent/CrewMonitor"

// Create a screen writing mobile application with a novel UX that no one has seen before, ensure the design is great
export function AgentPlaygroundView() {
  const { setGoal, agentList } = useAgentManager()

  return (
    <div className="flex flex-col gap-3 p-8 min-h-screen bg-slate-1 text-slate-11">
      <h2 className="text-2xl text-center font-bold text-slate-11">
        Agent Playground
      </h2>
      <div className="flex">
        <InputMessage
          placeholder="Enter Primary Goal"
          buttonText="Set"
          sendMessage={setGoal}
        />
      </div>

      <div className="flex flex-wrap w-full">
        <CaptainMonitor />
        {agentList.map((agent) => (
          <CrewMonitor key={agent.id} id={agent.id} />
        ))}
      </div>
    </div>
  )
}
