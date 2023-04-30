import { useWebVM } from "~core/providers/web-vm"

import "xterm/css/xterm.css"

const WebTerminal = () => {
  const { render } = useWebVM()

  return (
    <div className="flex justify-center w-full h-full">
      <div
        className="flex w-full px-2 py-2 bg-black rounded-md"
        ref={(el) => {
          if (el) {
            render(el)
          }
        }}
      />
    </div>
  )
}

export default WebTerminal
