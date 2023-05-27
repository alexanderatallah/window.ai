import clsx from "clsx"
import Balancer from "react-wrap-balancer"
import { type ChatMessage } from "window.ai"

// loading placeholder animation for the chat line
export const LoadingChatLine = () => (
  <div className="flex min-w-full animate-pulse px-4 py-5 sm:px-6">
    <div className="flex flex-grow space-x-3">
      <div className="min-w-0 flex-1">
        <p className="font-bold text-slate-11">
          <a href="#" className="hover:underline">
            AI
          </a>
        </p>
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 h-2 rounded bg-slate-9"></div>
            <div className="col-span-1 h-2 rounded bg-slate-9"></div>
          </div>
          <div className="h-2 rounded bg-slate-9"></div>
        </div>
      </div>
    </div>
  </div>
)

// util helper to convert new lines to <br /> tags
const convertNewLines = (text: string) =>
  text.split("\n").map((line, i) => (
    <span key={i}>
      {line}
      <br />
    </span>
  ))

export function ChatLine({ role = "assistant", content }: ChatMessage) {
  if (!content) {
    return null
  }
  const formatteMessage = convertNewLines(content)

  return (
    <div
      className={
        role != "assistant" ? "float-right clear-both" : "float-left clear-both"
      }>
      <div className="float-right mb-5 rounded-lg bg-slate-3 px-4 py-5 shadow-lg border-2 border-slate-7 sm:px-6">
        <div className="flex space-x-3">
          <div className="flex-1 gap-4">
            <p className="font-bold text-slate-12">
              <a href="#" className="hover:underline">
                {role == "assistant" ? "AI" : "You"}
              </a>
            </p>
            <p
              className={clsx(
                "text ",
                role == "assistant" ? "font-semibold" : "text-slate-11"
              )}>
              <Balancer className="break-words">{formatteMessage}</Balancer>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
