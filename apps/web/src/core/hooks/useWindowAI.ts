import { useEffect, useRef, useState } from "react"
import type {
  AIModelAvailability,
  AIPolyfill,
  AITextSession,
  AITextSessionOptions,
  ChatMessage
} from "window.ai"

// Default first message to display in UI (not necessary to define the prompt)
export const initialMessages: ChatMessage[] = [
  {
    role: "assistant",
    content: "Hi! I am a friendly AI assistant. Ask me anything!"
  }
]

export function useWindowAI(
  defaultMessages = initialMessages,
  {
    cacheSize = 10,
    prefixMessageCount = 0,
    temperature = 0.7,
    topK = 40,
    systemPrompt = ""
  }: {
    cacheSize?: number
    prefixMessageCount?: number
    temperature?: number
    topK?: number
    systemPrompt?: string
  } = {}
) {
  const messagesRef = useRef<ChatMessage[]>(defaultMessages)
  const [messages, setMessages] = useState<ChatMessage[]>(messagesRef.current)
  const [isReady, setIsReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [modelAvailability, setModelAvailability] =
    useState<AIModelAvailability>("no")
  const [permissionDenied, setPermissionDenied] = useState(false)
  const sessionRef = useRef<AITextSession | null>(null)
  const aiRef = useRef<AIPolyfill | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        if ("ai" in window && window.ai) {
          aiRef.current = window.ai as AIPolyfill
          const availability = await aiRef.current.canCreateTextSession()
          setModelAvailability(availability)
          if (availability !== "no") {
            setIsReady(true)
          }
        }
      } catch (error) {
        console.error("Error initializing window.ai:", error)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (aiRef.current && isReady && !sessionRef.current) {
      createSession()
    }
  }, [isReady])

  const createSession = async () => {
    if (!aiRef.current) return

    try {
      const options: AITextSessionOptions = {
        temperature,
        topK,
        systemPrompt,
        initialPrompts: messagesRef.current.slice(0, prefixMessageCount)
      }
      sessionRef.current = await aiRef.current.createTextSession(options)
    } catch (error) {
      console.error("Error creating AI text session:", error)
      setPermissionDenied(true)
    }
  }

  const sendMessage = async (message: string) => {
    if (!sessionRef.current) {
      console.error("AI text session not initialized")
      return null
    }

    setLoading(true)
    setPermissionDenied(false)

    const allMessages: ChatMessage[] = [
      ...messagesRef.current,
      { role: "user", content: message }
    ]

    try {
      const response = await sessionRef.current.prompt(message)
      console.log({ response })
      const responseMsg: ChatMessage = { role: "assistant", content: response }

      setMessages((messagesRef.current = [...allMessages, responseMsg]))
      return response
    } catch (error) {
      console.error("Error sending message:", error)
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setPermissionDenied(true)
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
      return null
    } finally {
      setLoading(false)
    }
  }

  const streamMessage = async (
    message: string,
    onData: (data: string) => void
  ) => {
    if (!sessionRef.current) {
      console.error("AI text session not initialized")
      return null
    }

    setLoading(true)
    setPermissionDenied(false)

    const allMessages: ChatMessage[] = [
      ...messagesRef.current,
      { role: "user", content: message }
    ]

    let responseContent = ""

    try {
      const stream = sessionRef.current.promptStreaming(message)
      console.log("Stream object:", stream)

      if (!(stream instanceof ReadableStream)) {
        throw new Error("Expected a ReadableStream, but got: " + typeof stream)
      }

      for await (const chunk of stream) {
        setLoading(false)
        console.log("Received chunk:", chunk)
        responseContent += chunk
        onData(chunk)
        setMessages(
          (messagesRef.current = [
            ...allMessages,
            { role: "assistant", content: responseContent }
          ])
        )
      }
    } catch (error) {
      console.error("Error streaming message:", error)
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setPermissionDenied(true)
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
      return null
    } finally {
    }
  }

  const clear = () => {
    setMessages((messagesRef.current = [...defaultMessages]))
    createSession() // Recreate the session with default messages
  }

  return {
    isReady,
    messages,
    sendMessage,
    streamMessage,
    clear,
    loading,
    modelAvailability,
    permissionDenied
  }
}
