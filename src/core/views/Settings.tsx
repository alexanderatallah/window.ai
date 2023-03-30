import { useState } from "react"
import useSWR from "swr"

import { get, post } from "~core/api"
import { Button } from "~core/components/pure/Button"
import { Dropdown } from "~core/components/pure/Dropdown"
import { Input } from "~core/components/pure/Input"
import { Spinner } from "~core/components/pure/Spinner"
import { Text } from "~core/components/pure/Text"
import { Well } from "~core/components/pure/Well"
import { CompletionResponse, LLM } from "~core/constants"
import { Config, configManager } from "~core/managers/config"
import { UserInfoProvider, useUserInfo } from "~core/providers/user-info"
import { isOk, unwrap } from "~core/utils/result-monad"

export function Settings() {
  const [loading, setLoading] = useState(false)
  const [selectedLLM, selectLLM] = useState<LLM>(LLM.GPT3)

  const { object } = configManager.useObject(selectedLLM)
  const config = object
  const [apiKeyValue, setApiKeyValue] = useState(config?.apiKey)

  async function saveAll() {
    return configManager.save({
      ...(config || {}),
      id: selectedLLM,
      apiKey: apiKeyValue
    })
  }

  return (
    <div className="flex flex-col">
      <Text size="lg" strength="bold">
        Settings
      </Text>
      <div className="my-4">
        <Text size="xs" strength="dim">
          Configure custom model settings here. If you don't add any API keys,
          you may be prompted to later, depending on your usage.
        </Text>
      </div>
      <Well>
        <Dropdown choices={Object.values(LLM)} onSelect={selectLLM}>
          {selectedLLM}
        </Dropdown>

        <div className="mt-2 py-6 px-1 rounded-md">
          {selectedLLM !== LLM.Local && (
            <div className="">
              <Input
                placeholder="API Key"
                value={apiKeyValue || ""}
                onChange={(val) => setApiKeyValue(val)}
                onBlur={saveAll}
              />
            </div>
          )}
        </div>
        {/* <div className="mt-4">
          <Button
            wide
            onClick={async () => {
              setLoading(true)
              await saveAll()
              setLoading(false)
            }}
            loading={loading}>
            Save
          </Button>
        </div> */}
      </Well>
    </div>
  )
}

//
//
//
// Delete the components below once we decide on Stripe

function DEP_Settings({ onSave }: { onSave: () => void }) {
  return (
    <UserInfoProvider>
      <Text size="lg" strength="bold">
        Settings
      </Text>
      <PersonalInfo />
      <div className="mt-4">
        <div className="font-bold">Premium features</div>
        <div className="text-sm text-slate-500">
          <StripeGatedButton />
        </div>
      </div>
      <Button onClick={onSave}>Save</Button>
    </UserInfoProvider>
  )
}

const PersonalInfo = () => {
  const userInfo = useUserInfo()

  return (
    <Text strength="dim">
      Email: <b>{userInfo?.email}</b>
    </Text>
  )
}

const StripeGatedButton = () => {
  const userInfo = useUserInfo()
  const [loading, setLoading] = useState(false)

  const { data, error } = useSWR(`/api/check-subscription`, (url) =>
    get<{ active: boolean }>(url).then(unwrap)
  )
  const isSubscribed = !error && data?.active

  if (!isSubscribed) {
    return (
      <div>
        {error && (
          <div style={{ color: "red" }}>
            Failed to fetch subscription: {error.toString()}
          </div>
        )}
        <button
          disabled={!userInfo}
          onClick={async () => {
            chrome.identity.getAuthToken(
              {
                interactive: true
              },
              (token) => {
                if (!!token) {
                  window.open(
                    `${
                      process.env.PLASMO_PUBLIC_STRIPE_LINK
                    }?client_reference_id=${
                      userInfo?.id || ""
                    }&prefilled_email=${encodeURIComponent(
                      userInfo?.email || ""
                    )}`,
                    "_blank"
                  )
                }
              }
            )
          }}>
          Unlock GPT-4
        </button>
      </div>
    )
  }

  return (
    <Button
      onClick={async (e) => {
        setLoading(true)
        const res = await post<CompletionResponse>("/api/model/complete", {
          prompt: "The quick brown fox"
        })
        setLoading(false)
        if (isOk(res)) {
          alert(res.data)
        }
      }}
      disabled={loading}
      className="bg-slate-300">
      The quick brown fox... {loading && <Spinner />}
    </Button>
  )
}
