import useSWR from "swr"

import "./style.css"

import { useState } from "react"
import browser from "webextension-polyfill"

import { get, post } from "~core/api"
import { Button } from "~core/components/Button"
import { Skeleton } from "~core/components/Skeleton"
import { Spinner } from "~core/components/Spinner"
import type { CompletionResponse } from "~core/constants"
import { Home } from "~core/pages/Home"
import { UserInfoProvider, useUserInfo } from "~core/user-info"

type PageType = "home" | "settings"

function Popup() {
  const [page, setPage] = useState("home" as PageType)
  return (
    <main className="bg-slate-200 text-slate-900 p-0 leading-5 font-sans">
      <UserInfoProvider>
        <Home setPage={setPage} />
        <Settings setPage={setPage} hide={page !== "settings"} />
      </UserInfoProvider>
    </main>
  )
}

export default Popup
