import { useWebVM } from "~features/web-vm/web-vm-provider"

import clsx from "clsx"

export const WebPreview = () => {
  const { activeUrl } = useWebVM()

  return (
    <div
      className={clsx(
        "flex justify-center w-full bg-white/80 rounded-md",
        activeUrl ? "h-full" : "h-0"
      )}>
      <iframe className="flex w-full h-full p-2" src={activeUrl} />
    </div>
  )
}
