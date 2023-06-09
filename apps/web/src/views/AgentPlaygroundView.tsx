import { InputMessage } from "~core/components/InputMessage"
import { useAgentManager } from "~demo/agent/agent-manager-provider"
import { AgentHiringCard } from "~demo/agent/AgentHiringCard"
import { CaptainMonitor } from "~demo/agent/CaptainMonitor"
import { CrewMonitor } from "~demo/agent/CrewMonitor"

// Create a screen writing mobile application with a novel UX that no one has seen before, ensure the design is great
export function AgentPlaygroundView() {
  const { goal, setGoal, agentList } = useAgentManager()

  return (
    <div className="flex flex-row min-h-screen bg-slate-1 text-slate-11">
      <div className="flex flex-col w-full p-8">
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
    </div>
  )
}
