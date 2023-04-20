import { Button } from "./Button"

type InputMessageProps = {
  input: string
  setInput: (input: string) => void
  sendMessage: (input: string) => void

  placeholder?: string
  buttonText?: string
}

export const InputMessage = ({
  input,
  setInput,
  sendMessage,
  placeholder = "Type a message",
  buttonText = "Say"
}: InputMessageProps) => (
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
      {buttonText}
    </Button>
  </div>
)
