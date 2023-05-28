import clsx from "clsx"
import Link from "next/link"
import { Button } from "~core/components/Button"
import { EXTENSION_CHROME_URL } from "~core/components/common"

export const GetExtensionButton = ({ className = "", isPlain = false }) => (
  <Link target="_blank" href={EXTENSION_CHROME_URL} className={className}>
    <Button
      className={clsx(
        isPlain
          ? "bg-slate-8 hover:bg-slate-8/70 text-slate-12 active:text-slate-12/70 text-sm"
          : "bg-indigo-9 hover:bg-indigo-11 text-white text-md",
        "w-full h-full"
      )}>
      Get the extension
    </Button>
  </Link>
)
