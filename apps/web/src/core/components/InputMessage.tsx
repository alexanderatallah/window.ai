import { useCallback, useState } from "react"
import { Button } from "./Button"

type InputMessageProps = {
  sendMessage: (input: string) => void
  placeholder?: string
  buttonText?: string
  clearInput?: boolean
}

export const InputMessage = ({
  sendMessage,
  placeholder = "Type a message",
  buttonText = "Say",
  clearInput = false
}: InputMessageProps) => {
  const [input, setInput] = useState("")

  const submit = useCallback(() => {
    sendMessage(input)
    if (clearInput) {
      setInput("")
    }
  }, [input, clearInput])

  return (
    <div className="mt-6 flex clear-both w-full">
      <input
        type="text"
        aria-label="chat input"
        required
        placeholder={placeholder}
        className="min-w-0 flex-auto appearance-none rounded-md border border-zinc-900/10 bg-white px-3 py-[calc(theme(spacing.2)-1px)] shadow-md shadow-zinc-800/5 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 sm:text-sm"
        value={input}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            submit()
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
          submit()
        }}>
        {buttonText}
      </Button>
    </div>
  )
}
