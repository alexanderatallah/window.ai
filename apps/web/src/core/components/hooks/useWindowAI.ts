import { useEffect, useRef, useState } from "react"
import {
  type ChatMessage,
  ErrorCode,
  type WindowAI,
  getWindowAI,
  isMessageOutput
} from "window.ai"

// default first message to display in UI (not necessary to define the prompt)
export const initialMessages: ChatMessage[] = [
  {
    role: "assistant",
    content: "Hi! I am a friendly AI assistant. Ask me anything!"
  }
]

export function useWindowAI(
  defaultMessages = initialMessages,
  { cacheSize = 10 } = {}
) {
  const [messages, setMessages] = useState<ChatMessage[]>(defaultMessages)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [showInstallMessage, setShowInstallMessage] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const windowAIRef = useRef<WindowAI>()

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

    const messageCache = newMessages.slice(-cacheSize)

    const responseMsg: ChatMessage = { role: "assistant", content: "" }
    const allMsgs = [...newMessages]

    setMessages([...allMsgs, { ...responseMsg }])
    setPermissionDenied(false)

    try {
      await windowAIRef.current.getCompletion(
        {
          messages: [...messageCache]
        },
        {
          onStreamResult: (result, error) => {
            if (error) {
              throw error
            }

            if (isMessageOutput(result!)) {
              responseMsg.content += result.message.content
              setMessages([...allMsgs, { ...responseMsg }])
            }
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

  return {
    messages,
    input,
    setInput,
    sendMessage,
    loading,
    showInstallMessage,
    permissionDenied
  }
}
