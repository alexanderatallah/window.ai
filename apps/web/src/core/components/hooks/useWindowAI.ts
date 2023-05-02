import { useEffect, useRef, useState } from "react"
import {
  ErrorCode,
  getWindowAI,
  type ChatMessage,
  type WindowAI
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
  { cacheSize = 10, stream = false, keep = 0, maxTokens = 2048 } = {}
) {
  const messagesRef = useRef<ChatMessage[]>(defaultMessages)
  const [messages, setMessages] = useState<ChatMessage[]>(messagesRef.current)
  const [isReady, setIsReady] = useState(false)
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
        setIsReady(true)
      } catch {
        setShowInstallMessage(true)
      }
    }
    init()
  }, [])

  // send message to API /api/chat endpoint
  const sendMessage = async (
    message: string,
    onData?: (data: string) => void
  ) => {
    if (showInstallMessage || !windowAIRef.current) {
      return null
    }

    setLoading(true)

    const allMessages: ChatMessage[] = [
      ...messagesRef.current,
      { role: "user", content: message }
    ]

    const responseMsg: ChatMessage = { role: "assistant", content: "" }

    setMessages((messagesRef.current = [...allMessages, { ...responseMsg }]))
    setPermissionDenied(false)

    const keptMessages = allMessages.slice(0, keep)
    const ctxMessages = allMessages.slice(keep)

    const messageCache = [...keptMessages, ...ctxMessages.slice(-cacheSize)]

    try {
      if (stream || typeof onData === "function") {
        const [result] = await windowAIRef.current.generateText(
          {
            messages: [...messageCache]
          },
          {
            maxTokens,

            onStreamResult: (result, error) => {
              if (error) {
                throw error
              }

              responseMsg.content += result?.message.content
              setMessages(
                (messagesRef.current = [...allMessages, { ...responseMsg }])
              )
              if (onData && !!result) {
                onData(result.message.content)
              }
            }
          }
        )
        return result
      } else {
        const [result] = await windowAIRef.current.generateText(
          {
            messages: [...messageCache]
          },
          {
            maxTokens
          }
        )
        responseMsg.content = result.message.content

        setMessages(
          (messagesRef.current = [...allMessages, { ...responseMsg }])
        )
        return result
      }
    } catch (e) {
      console.error(e)
      if (e === ErrorCode.PermissionDenied) {
        setPermissionDenied(true)
        setMessages(() => {
          messagesRef.current.pop()
          return (messagesRef.current = [...messagesRef.current])
        })
      } else {
        setMessages(
          (messagesRef.current = [
            ...messagesRef.current,
            {
              role: "assistant",
              content: "Sorry, I had an error. Please try again later."
            }
          ])
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const clear = () => {
    setMessages((messagesRef.current = [...defaultMessages]))
  }

  return {
    isReady,
    messages,
    sendMessage,
    clear,
    loading,
    showInstallMessage,
    permissionDenied
  }
}
