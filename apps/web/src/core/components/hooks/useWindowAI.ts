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
  { cacheSize = 10, stream = false } = {}
) {
  const [messages, setMessages] = useState<ChatMessage[]>(defaultMessages)
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
  const sendMessage = async (message: string) => {
    if (showInstallMessage || !windowAIRef.current) {
      return null
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
      if (stream) {
        await windowAIRef.current.getCompletion(
          {
            messages: [...messageCache]
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
      } else {
        const result = await windowAIRef.current.getCompletion(
          {
            messages: [...messageCache]
          },
          {
            maxTokens: 2048
          }
        )
        responseMsg.content = result.message.content
        setMessages([...allMsgs, { ...responseMsg }])
        return result
      }
    } catch (e) {
      console.error(e)
      if (e === ErrorCode.PermissionDenied) {
        setPermissionDenied(true)
        setMessages((p) => {
          p.pop()
          return [...p]
        })
      } else {
        setMessages([
          ...messages,
          {
            role: "assistant",
            content: "Sorry, I had an error. Please try again later."
          }
        ])
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    isReady,
    messages,
    sendMessage,
    loading,
    showInstallMessage,
    permissionDenied
  }
}
