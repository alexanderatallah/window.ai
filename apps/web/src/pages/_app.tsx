import type { AppProps } from "next/app"
import { Analytics } from "~core/components/Analytics"
import "@vercel/examples-ui/globals.css"
import Link from "next/link"
import { Discord } from "~core/components/icons/Discord"
import { GitHub } from "~core/components/icons/Github"
import { Twitter } from "~core/components/icons/Twitter"

import {
  DISCORD_URL,
  EXTENSION_CHROME_URL,
  GITHUB_URL,
  TWITTER_URL
} from "~core/components/common"
import "~style.css"
import { Button } from "~core/components/Button"
import { GetExtensionButton } from "~core/components/GetExtensionButton"

function Layout({ children }: any) {
  return (
    <div className="h-screen flex flex-col">
      <div className="bg-slate-1 text-slate-11">{children}</div>
      <footer className="py-10 w-full mt-auto flex items-center justify-end bg-slate-2 z-20 px-20">
        <div className="flex items-center gap-4">
          <div className="w-40">
            <GetExtensionButton />
          </div>
          <Link href={DISCORD_URL}>
            <Discord className="w-6 h-6 text-slate-11 hover:text-slate-12" />
          </Link>
          <Link href={GITHUB_URL}>
            <GitHub className="w-6 h-6 text-slate-11 hover:text-slate-12" />
          </Link>
          <Link href={TWITTER_URL}>
            <Twitter className="w-6 h-6 text-slate-11 hover:text-slate-12" />
          </Link>
        </div>
      </footer>
    </div>
  )
}

function App({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      <Component {...pageProps} />
      <Analytics />
    </Layout>
  )
}

export default App
