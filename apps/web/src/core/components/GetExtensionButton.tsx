import clsx from "clsx"
import Link from "next/link"
import { Button } from "~core/components/Button"
import { EXTENSION_CHROME_URL } from "~core/components/common"

export const GetExtensionButton = ({ className = "" }) => (
  <Link target="_blank" href={EXTENSION_CHROME_URL}>
    <Button
      className={clsx(
        "bg-indigo-9 hover:bg-indigo-10 text-white hover:text-white/80",
        className
      )}>
      Get the extension
    </Button>
  </Link>
)
