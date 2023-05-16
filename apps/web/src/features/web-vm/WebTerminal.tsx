import { useWebVM } from "~features/web-vm/web-vm-provider"

import "xterm/css/xterm.css"

export const WebTerminal = () => {
  const { render } = useWebVM()

  return (
    <div className="flex justify-center w-full h-full bg-black rounded-md p-2">
      <div
        className="flex w-full h-full"
        ref={(el) => {
          if (el) {
            render(el)
          }
        }}
      />
    </div>
  )
}
