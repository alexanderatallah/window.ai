import clsx from "clsx"
import Balancer from "react-wrap-balancer"
import type { ChatMessage } from "window.ai"
import Tooltip from "~core/components/Tooltip"

function ThinkingIndicator() {
  return (
    <Tooltip content="Thinking">
      <div className="flex justify-center p-2 items-center gap-2 text-xs">
        <span className="animate-bounce rounded-full h-1 w-1 bg-slate-11" />
        <span
          className="animate-bounce rounded-full h-1 w-1 bg-slate-11"
          style={{
            animationDelay: "0.1s"
          }}
        />
        <span
          className="animate-bounce rounded-full h-2 w-1 bg-slate-11"
          style={{
            animationDelay: "0.2s"
          }}
        />
        <span
          className="animate-bounce rounded-full h-2 w-1 bg-slate-11"
          style={{
            animationDelay: "0.3s"
          }}
        />
        <span
          className="animate-bounce rounded-full h-1 w-1 bg-slate-11"
          style={{
            animationDelay: "0.4s"
          }}
        />
        <span
          className="animate-bounce rounded-full h-1 w-1 bg-slate-11"
          style={{
            animationDelay: "0.5s"
          }}
        />
      </div>
    </Tooltip>
  )
}

export const AgentMonitor = ({
  id = "agent-id",
  name = "Agent Name",
  purpose = "Purpose",
  description = "Description: Lorem ipsum dolor sit amet consectetur adipisicing elit. Quo esse suscipit, necessitatibus corrupti ducimus, labore autem saepe sint magni, iure voluptatibus deserunt voluptates corporis blanditiis obcaecati exercitationem beatae dolore porro.",
  messages = [] as ChatMessage[],
  isThinking = false
}) => {
  return (
    <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 p-2">
      <div
        className={clsx(
          "flex flex-col rounded-lg transition-colors",
          "bg-slate-3 hover:bg-slate-4"
        )}>
        <div className="bg-slate-6 p-2 rounded-t-lg">
          <h3 className="font-bold">{name}</h3>
          <Tooltip content={description}>
            <h4 className="text-xs">
              <Balancer>{purpose}</Balancer>
            </h4>
          </Tooltip>
        </div>
        <ul
          className={clsx(
            "p-2 max-h-40 overflow-auto",
            "flex flex-col",
            "text-xs"
          )}>
          {messages.map((message, index) => (
            <li key={`${id}-msg-${index}`}>{message.content}</li>
          ))}
        </ul>
        {isThinking && <ThinkingIndicator />}
      </div>
    </div>
  )
}
