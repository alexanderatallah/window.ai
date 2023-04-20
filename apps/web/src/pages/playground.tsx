import { InputMessage } from "~core/components/InputMessage"
import { useWindowAI } from "~core/components/hooks/useWindowAI"
import clsx from "clsx"
import {
  AgentManagerProvider,
  useAgentManager
} from "~core/providers/useAgentManager"

const AgentMonitor = ({ name = "Agent Name", purpose = "Purpose" }) => {
  return (
    <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 p-2">
      <div
        className={clsx(
          "flex flex-col rounded-lg transition-colors",
          "bg-slate-3 hover:bg-slate-4"
        )}>
        <div className="bg-slate-6 p-2 rounded-t-lg">
          <h3 className="font-bold">{name}</h3>
          <h4 className="text-xs">{purpose}</h4>
        </div>
        <ul className={clsx("p-2 max-h-40 overflow-auto", "flex flex-col")}>
          <li>Hello world</li>
          <li>What can I do?</li>
          <li>What can I do?</li>
          <li>What can I do?</li>
          <li>What can I do?</li>
          <li>What can I do?</li>
          <li>What can I do?</li>
          <li>What can I do?</li>
          <li>What can I do?</li>
          <li>What can I do?</li>
          <li>What can I do?</li>
          <li>What can I do?</li>
          <li>What can I do?</li>
          <li>What can I do?</li>
        </ul>
      </div>
    </div>
  )
}

function Playground() {
  const { managerAI } = useAgentManager()

  return (
    <div className="flex flex-col gap-3 p-8 min-h-screen bg-slate-1 text-slate-11">
      <h2 className="text-2xl text-center font-bold text-slate-11">
        Agent Playground
      </h2>
      <div className="flex">
        <InputMessage
          placeholder="Enter Primary Goal"
          buttonText="Set"
          input={managerAI.input}
          setInput={managerAI.setInput}
          sendMessage={managerAI.sendMessage}
        />
      </div>

      <div className="flex flex-wrap w-full">
        <AgentMonitor
          name="Manager"
          purpose="Facilitate Primary Goal and Hiring new Agent"
        />
      </div>
    </div>
  )
}

export default function PlaygroundPage() {
  return (
    <AgentManagerProvider>
      <Playground />
    </AgentManagerProvider>
  )
}
