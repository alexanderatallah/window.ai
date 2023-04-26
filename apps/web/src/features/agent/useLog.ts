import { useState } from "react"
import type { ChatMessage } from "window.ai"

export function useLog() {
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const add = (content = "") => {
    if (!content) {
      return
    }
    setMessages((m) => [
      ...m,
      {
        content,
        role: "assistant"
      }
    ])
  }

  const remove = (content: string) => {
    setMessages((m) => m.filter((msg) => msg.content !== content))
  }

  return {
    messages,
    add,
    remove
  }
}
