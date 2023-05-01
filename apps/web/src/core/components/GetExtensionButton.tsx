import clsx from "clsx"
import { Button } from "~core/components/Button"
import { EXTENSION_CHROME_URL } from "~core/components/common"

export const GetExtensionButton = ({ className = "" }) => (
  <Button
    onClick={() => window.open(EXTENSION_CHROME_URL, "_blank")}
    className={clsx(
      "bg-indigo-9 hover:bg-indigo-10 text-white hover:text-white/80",
      className
    )}>
    Get the extension
  </Button>
)
