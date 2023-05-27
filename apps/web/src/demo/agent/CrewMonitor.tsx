import { AgentMonitor } from "~demo/agent/AgentMonitor"
import { OODAState, useCrew } from "~demo/agent/useCrew"

export const CrewMonitor = ({ id = "" }) => {
  const { agent, state, log } = useCrew({ id })

  return (
    <AgentMonitor
      id={id}
      name={agent.name}
      purpose={agent.purpose}
      description={agent.description}
      messages={log.messages}
      // isDebugging
      isThinking={state !== OODAState.Idle && state !== OODAState.Blocked}>
      <div className="flex flex-col items-center gap-2 m-2 text-sm">
        {state}
      </div>
    </AgentMonitor>
  )
}
