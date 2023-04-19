import type { AppProps } from "next/app"
import { Analytics } from "@vercel/analytics/react"
import "@vercel/examples-ui/globals.css"
import Link from "next/link"
import { Discord } from "../components/icons/Discord"
import { GitHub } from "../components/icons/Github"
import { Twitter } from "../components/icons/Twitter"

import "../styles/globals.css"
import { DISCORD_URL, GITHUB_URL, TWITTER_URL } from "../components/common"

function Layout({ children }: any) {
  return (
    <div className="h-screen flex flex-col">
      <div className="bg-accents-0">{children}</div>
      <footer className="py-10 w-full mt-auto border-t flex items-center justify-between bg-accents-1 z-20 px-20">
        <span className="text-primary"></span>
        <div className="flex space-x-4">
          <Link href={DISCORD_URL}>
            <Discord className="w-8 h-8 text-neutral-500" />
          </Link>
          <Link href={GITHUB_URL}>
            <GitHub className="w-8 h-8 text-neutral-500" />
          </Link>
          <Link href={TWITTER_URL}>
            <Twitter className="w-8 h-8 text-neutral-500" />
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
