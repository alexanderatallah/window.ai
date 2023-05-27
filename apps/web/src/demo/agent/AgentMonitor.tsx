import { IconInfoCircle } from "@tabler/icons-react"
import clsx from "clsx"
import type { ReactNode } from "react"
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
  name = "Agent Name" as ReactNode,
  purpose = "Purpose" as ReactNode,
  description = "Description: Lorem ipsum dolor sit amet consectetur adipisicing elit. Quo esse suscipit, necessitatibus corrupti ducimus, labore autem saepe sint magni, iure voluptatibus deserunt voluptates corporis blanditiis obcaecati exercitationem beatae dolore porro." as ReactNode,
  messages = [] as ChatMessage[],
  isThinking = false,
  children = null as ReactNode,
  isDebugging = false
}) => {
  return (
    <div
      className={clsx(
        !isDebugging && "sm:w-1/2 md:w-1/3 lg:w-1/4", //
        "p-2 w-full"
      )}>
      <div
        className={clsx(
          "flex flex-col rounded-lg transition-colors",
          "bg-slate-3 hover:bg-slate-4"
        )}>
        <div className="bg-slate-6 hover:bg-slate-7 p-2 rounded-t-lg gap-2 flex flex-col">
          <div className={clsx("flex justify-between")}>
            <h3 className="font-bold w-full">{name}</h3>
            {typeof description === "string" && (
              <Tooltip content={description}>
                <IconInfoCircle />
              </Tooltip>
            )}
          </div>
          <h4 className="text-xs">
            {typeof purpose === "string" ? (
              <Balancer>{purpose}</Balancer>
            ) : (
              purpose
            )}
          </h4>

          {typeof description !== "string" && description}
        </div>
        <ul
          className={clsx(
            !isDebugging && "max-h-96",
            "p-2 overflow-auto",
            "flex flex-col",
            "text-xs"
          )}>
          {messages.map((message, index) => (
            <li
              key={`${id}-msg-${index}`}
              className={clsx(
                "whitespace-pre-wrap p-2",
                "hover:bg-slate-5",
                "rounded-md"
              )}>
              {message.content}
            </li>
          ))}
        </ul>
        {children}
        {isThinking && <ThinkingIndicator />}
      </div>
    </div>
  )
}
