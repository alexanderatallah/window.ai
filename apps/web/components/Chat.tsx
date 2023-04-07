import { useEffect, useRef, useState } from "react"
import { Button } from "./Button"
import { type ChatGPTMessage, ChatLine, LoadingChatLine } from "./ChatLine"
import { useCookies } from "react-cookie"
import { DISCORD_URL, DOWNLOAD_URL } from "./common"

const COOKIE_NAME = "nextjs-example-ai-chat-gpt3"

// default first message to display in UI (not necessary to define the prompt)
export const initialMessages: ChatGPTMessage[] = [
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
  const [messages, setMessages] = useState<ChatGPTMessage[]>(initialMessages)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [cookie, setCookie] = useCookies([COOKIE_NAME])
  const [showInstallMessage, setShowInstallMessage] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)

  useEffect(() => {
    if (!cookie[COOKIE_NAME]) {
      // generate a semi random short id
      const randomId = Math.random().toString(36).substring(7)
      setCookie(COOKIE_NAME, randomId)
    }
  }, [cookie, setCookie])

  // send message to API /api/chat endpoint
  const sendMessage = async (message: string) => {
    if (!("ai" in window)) {
      setShowInstallMessage(true)
      return
    }
    setShowInstallMessage(false)
    setLoading(true)
    const newMessages = [
      ...messages,
      { role: "user", content: message } as ChatGPTMessage
    ]
    setMessages(newMessages)
    const last10messages = newMessages.slice(-10) // remember last 10 messages

    const responseMsg = { role: "assistant", content: "" }
    const allMsgs = [...newMessages]

    //@ts-ignore
    setMessages([...allMsgs, { ...responseMsg }])
    setPermissionDenied(false)

    try {
      await window.ai.getCompletion(
        {
          messages: [...last10messages]
        },
        {
          onStreamResult: (result: any, error: any) => {
            if (error) {
              throw error
            }

            responseMsg.content += result.message.content

            //@ts-ignore
            setMessages([...allMsgs, { ...responseMsg }])
          }
        }
      )
    } catch (e) {
      console.log("error", e)
      if (e === "PERMISSION_DENIED") {
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

      console.log(e)
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
          <span className="mx-auto flex flex-grow text-gray-600 clear-both">
            Type a message to start the conversation
          </span>
        )}
        {permissionDenied && (
          <span className="mx-auto flex flex-grow text-red-400 clear-both">
            window.ai permission denied!
          </span>
        )}
        {showInstallMessage && (
          <div className="grid grid-cols-2 gap-6">
            <Button
              onClick={() => window.open(DISCORD_URL, "_blank")}
              className="">
              Download the beta
            </Button>
            <Button
              onClick={() =>
                window.open(
                  "https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked",
                  "_blank"
                )
              }>
              How to install
            </Button>
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
