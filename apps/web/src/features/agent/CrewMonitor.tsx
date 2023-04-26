import { AgentMonitor } from "~features/agent/AgentMonitor"
import { useCrew } from "~features/agent/useCrew"

export const CrewMonitor = ({ id = "" }) => {
  const { agent, state, log } = useCrew({ id })

  return (
    <AgentMonitor
      id={id}
      name={agent.name}
      purpose={agent.purpose}
      description={agent.description}
      messages={log.messages}>
      <div className="flex flex-col items-center gap-2 mb-2 text-sm">
        {state}
      </div>
    </AgentMonitor>
  )
}
