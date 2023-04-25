import { useEffect, useRef, useState } from "react"
import { Button } from "./Button"
import { ChatLine, LoadingChatLine } from "./ChatLine"
import { useCookies } from "react-cookie"
import { DISCORD_URL, EXTENSION_CHROME_URL } from "./common"
import { ChatMessage, ErrorCode, WindowAI, getWindowAI } from "window.ai"

const COOKIE_NAME = "nextjs-example-ai-chat-gpt3"

// default first message to display in UI (not necessary to define the prompt)
export const initialMessages: ChatMessage[] = [
  {
    role: "assistant",
    content: "Hi! I am a friendly AI assistant. Ask me anything!"
  }
]

const InputMessage = ({ input, setInput, sendMessage }: any) => (
  <div className="mt-6 flex clear-both">
    <input
      type="text"
      aria-label="chat input"
      required
      className="min-w-0 flex-auto appearance-none rounded-md border border-zinc-900/10 bg-white px-3 py-[calc(theme(spacing.2)-1px)] shadow-md shadow-zinc-800/5 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 sm:text-sm"
      value={input}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          sendMessage(input)
          setInput("")
        }
      }}
      onChange={(e) => {
        setInput(e.target.value)
      }}
    />
    <Button
      type="submit"
      className="ml-4 flex-none"
      onClick={() => {
        sendMessage(input)
        setInput("")
      }}>
      Say
    </Button>
  </div>
)

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [cookie, setCookie] = useCookies([COOKIE_NAME])
  const [showInstallMessage, setShowInstallMessage] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const windowAIRef = useRef<WindowAI>()

  useEffect(() => {
    if (!cookie[COOKIE_NAME]) {
      // generate a semi random short id
      const randomId = Math.random().toString(36).substring(7)
      setCookie(COOKIE_NAME, randomId)
    }
  }, [cookie, setCookie])

  // TODO: This efefct can be an util hook
  useEffect(() => {
    const init = async () => {
      try {
        // we can also just use the waitForWindowAI method here, and use window.ai directly down there as well
        windowAIRef.current = await getWindowAI()
      } catch {
        setShowInstallMessage(true)
      }
    }
    init()
  }, [])

  // send message to API /api/chat endpoint
  const sendMessage = async (message: string) => {
    if (showInstallMessage || !windowAIRef.current) {
      return
    }

    setLoading(true)

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: message }
    ]

    setMessages(newMessages)

    const last10messages = newMessages.slice(-10) // remember last 10 messages

    const responseMsg: ChatMessage = { role: "assistant", content: "" }
    const allMsgs = [...newMessages]

    setMessages([...allMsgs, { ...responseMsg }])
    setPermissionDenied(false)

    try {
      await windowAIRef.current.getCompletion(
        {
          messages: [...last10messages]
        },
        {
          onStreamResult: (result, error) => {
            if (error) {
              throw error
            }

            responseMsg.content += result?.message.content
            setMessages([...allMsgs, { ...responseMsg }])
          }
        }
      )
    } catch (e) {
      console.error(e)
      if (e === ErrorCode.PermissionDenied) {
        setPermissionDenied(true)
        setMessages((p) => {
          p.pop()
          return [...p]
        })
        setLoading(false)
        return
      }

      setMessages([
        ...messages,
        {
          role: "assistant",
          content: "Sorry, I had an error. Please try again later."
        }
      ])
    }

    setLoading(false)
  }

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
      <div className="rounded-2xl border-zinc-100 border p-6 w-full h-[360px] flex flex-col">
        <div className="flex-grow overflow-y-auto pr-8 pl-4" ref={messagesRef}>
          {messages.map(({ content, role }, index) => (
            <ChatLine key={index} role={role} content={content} />
          ))}

          {loading && <LoadingChatLine />}
        </div>
        {messages.length < 2 && (
          <span className="mx-auto flex flex-grow text-gray-600 clear-both text-sm">
            Type a message to start the conversation
          </span>
        )}
        {permissionDenied && (
          <span className="mx-auto flex flex-grow text-red-400 clear-both text-sm">
            window.ai permission denied!
          </span>
        )}
        {showInstallMessage && (
          <div className="flex flex-col gap-2 text-sm">
            <p className="px-4 text-center text-gray-400">
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
        <InputMessage
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
        />
      </div>
    </div>
  )
}
