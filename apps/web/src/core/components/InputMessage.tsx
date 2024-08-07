import { useCallback, useState } from "react"
import { Button } from "./Button"
import clsx from "clsx"

type InputMessageProps = {
  sendMessage: (input: string) => void
  placeholder?: string
  buttonText?: string
  clearInput?: boolean
  defaultInput?: string
  streamMessage: (
    message: string,
    onData: (data: string) => void
  ) => Promise<string | null>
}

export const InputMessage = ({
  sendMessage,
  placeholder = "Type a message",
  buttonText = "Say",
  clearInput = false,
  defaultInput = "",
  streamMessage
}: InputMessageProps) => {
  const [input, setInput] = useState(defaultInput)

  const submit = useCallback(() => {
    sendMessage(input)
    if (clearInput) {
      setInput("")
    }
  }, [input, clearInput])

  const submitAndStream = useCallback(() => {
    streamMessage(input, async (data) => console.log(data))
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
        className={clsx(
          "min-w-0 flex-auto appearance-none rounded-md border sm:text-sm",
          "border-slate-7 focus:border-slate-8",
          "bg-slate-1 placeholder:text-slate-11 text-slate-12",
          "px-3 py-[calc(theme(spacing.2)-1px)]",
          "shadow-md shadow-slate-1/5 focus:outline-none focus:ring-4 focus:ring-slate-7/10"
        )}
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
      <Button
        type="submit"
        className="ml-4 flex-none"
        onClick={() => {
          submitAndStream()
        }}>
        {buttonText} stream
      </Button>
    </div>
  )
}
