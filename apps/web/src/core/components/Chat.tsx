import { useEffect, useRef } from "react"
import { useCookies } from "react-cookie"
import { Button } from "./Button"
import { ChatLine, LoadingChatLine } from "./ChatLine"
import { InputMessage } from "./InputMessage"
import { DISCORD_URL, EXTENSION_CHROME_URL } from "./common"
import { initialMessages, useWindowAI } from "./hooks/useWindowAI"

const COOKIE_NAME = "nextjs-example-ai-chat-gpt3"

export function Chat() {
  const {
    permissionDenied,
    loading,
    messages,
    sendMessage,
    showInstallMessage
  } = useWindowAI(initialMessages, {
    stream: true
  })

  const [cookie, setCookie] = useCookies([COOKIE_NAME])

  useEffect(() => {
    if (!cookie[COOKIE_NAME]) {
      // generate a semi random short id
      const randomId = Math.random().toString(36).substring(7)
      setCookie(COOKIE_NAME, randomId)
    }
  }, [cookie, setCookie])

  const messagesRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }

  // scroll when new message is added
  useEffect(() => {
    if (messagesRef.current) {
      scrollToBottom()
    }
  }, [messages])

  return (
    <div className="w-full pt-10">
      <div className="rounded-lg border-slate-11 border p-6 w-full h-[360px] flex flex-col">
        <div className="flex-grow overflow-y-auto pr-8 pl-4" ref={messagesRef}>
          {messages.map(({ content, role }, index) => (
            <ChatLine key={index} role={role} content={content} />
          ))}
          {loading && <LoadingChatLine />}
        </div>
        {messages.length < 2 && (
          <span className="mx-auto flex flex-grow text-slate-11 clear-both text-sm">
            Type a message to start the conversation
          </span>
        )}
        {permissionDenied && (
          <span className="mx-auto flex flex-grow text-red-9 clear-both text-sm">
            window.ai permission denied!
          </span>
        )}
        {showInstallMessage && (
          <div className="flex flex-col gap-2 text-sm">
            <p className="px-4 text-center text-slate-11">
              window.ai not found on your browser!
            </p>
            <div className="grid grid-cols-2 gap-6">
              <Button
                onClick={() => window.open(EXTENSION_CHROME_URL, "_blank")}
                className=" bg-indigo-600 hover:bg-indigo-500 ">
                Get the extension
              </Button>
              <Button onClick={() => window.open(DISCORD_URL, "_blank")}>
                Join the community
              </Button>
            </div>
          </div>
        )}
        <InputMessage sendMessage={sendMessage} clearInput />
      </div>
    </div>
  )
}
