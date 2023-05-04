import { InformationCircleIcon } from "@heroicons/react/24/outline"
import { useEffect, useMemo, useState } from "react"

import { useParams } from "~core/components/hooks/useParams"
import { usePermissionPort } from "~core/components/hooks/usePermissionPort"
import { Accordion } from "~core/components/pure/Accordion"
import { Button } from "~core/components/pure/Button"
import { Dropdown } from "~core/components/pure/Dropdown"
import { Input } from "~core/components/pure/Input"
import { Splitter } from "~core/components/pure/Splitter"
import { Text } from "~core/components/pure/Text"
import Tooltip from "~core/components/pure/Tooltip"
import { Well } from "~core/components/pure/Well"
import { AuthType, type Config, configManager } from "~core/managers/config"
import { useConfig } from "~core/providers/config"
import { objectEntries } from "~core/utils/utils"
import { ModelID } from "~public-interface"

type ConfigSetting = { auth: AuthType; model?: ModelID }

const configSettings: ConfigSetting[] = [
  { auth: AuthType.External },
  { auth: AuthType.APIKey, model: ModelID.GPT3 },
  { auth: AuthType.APIKey, model: ModelID.GPT4 },
  { auth: AuthType.APIKey, model: ModelID.Together },
  { auth: AuthType.APIKey, model: ModelID.Cohere },
  { auth: AuthType.APIKey } // Local model
]

export function Settings() {
  const { config, setConfig } = useConfig()
  const { data } = usePermissionPort()
  const { requestId } = useParams()
  const [apiKey, setApiKey] = useState("")
  const [url, setUrl] = useState("")

  // Only show dropdown if there is no permission request
  // or if the permission request is for the default model
  const showDefaultConfigDropdown =
    !data || ("requester" in data && !data.requester.transaction.model)

  useEffect(() => {
    setApiKey(config?.apiKey || "")
    setUrl(config?.baseUrl || "")
  }, [config])

  async function saveDefaultConfig(authType: AuthType, modelId?: ModelID) {
    const config =
      (await configManager.forAuthAndModel(authType, modelId)) ||
      configManager.init(authType, modelId)
    await configManager.setDefault(config)
    setConfig(config)
  }

  async function saveAll() {
    if (!config) {
      return
    }
    return configManager.save({
      ...config,
      apiKey: apiKey,
      baseUrl: url
    })
  }

  const isLocalModel =
    config?.auth === AuthType.APIKey && config?.models.length === 0
  const needsAPIKey = config?.auth === AuthType.APIKey
  const asksForAPIKey = needsAPIKey || isLocalModel // Some local models need keys, e.g. https://github.com/keldenl/gpt-llama.cpp
  const isExternal = config?.auth === AuthType.External
  const isOpenAIAPI = useMemo(
    () =>
      needsAPIKey &&
      !!config?.models.find((m) => m === ModelID.GPT3 || m === ModelID.GPT4),
    [needsAPIKey, config]
  )

  return (
    <div className="flex flex-col">
      <Text size="lg" strength="bold">
        Configuration
      </Text>
      <div className="my-4">
        {requestId ? (
          <div className="bg-rose-700 text-white rounded-md py-4 px-6">
            {config?.session && config.auth === AuthType.External
              ? "Authentication error. Please sign in again."
              : "Please finish setting up the model below."}
          </div>
        ) : (
          <Text size="xs" dimming="less">
            Change your model settings here.
          </Text>
        )}
      </div>
      {showDefaultConfigDropdown && (
        <Well>
          <div className="-my-3">
            <Text strength="medium" dimming="less">
              Default provider
            </Text>
          </div>
          <Splitter />
          <Dropdown<ConfigSetting>
            styled
            choices={configSettings}
            getLabel={(c) => {
              return configManager.getLabelForAuth(c.auth, c.model)
            }}
            onSelect={(c) => {
              saveDefaultConfig(c.auth, c.model)
            }}>
            {config?.label}
          </Dropdown>
        </Well>
      )}
      <div className="py-4">
        <Well>
          <div className="-my-3 flex flex-row justify-between">
            <Text strength="medium" dimming="less">
              Settings:
            </Text>
            {!showDefaultConfigDropdown && (
              <Text align="right" strength="medium" dimming="more">
                {config?.label}
              </Text>
            )}
          </div>

          <Splitter />

          <div>
            {asksForAPIKey && (
              <Input
                placeholder="API Key"
                value={apiKey || ""}
                onChange={(val) => setApiKey(val)}
                onBlur={saveAll}
              />
            )}
            {isExternal && <ExternalSettings config={config} />}
            <div className="mt-3"></div>
            {needsAPIKey && (
              <Text dimming="less" size="xs">
                {apiKey ? "Monitor your" : "Obtain an"} API key{" "}
                <a
                  href={configManager.getExternalConfigURL(config)}
                  target="_blank"
                  className="font-bold"
                  rel="noreferrer">
                  here
                </a>{" "}
                <Tooltip
                  content={
                    <span>
                      API keys are only stored in your browser. For OpenAI, you
                      must have a paid account, otherwise your key will be
                      rate-limited excessively.
                      <br />
                      <br />
                      An API key is required for the OpenAI and Cohere models,
                      but not for Together or Local (running on your computer).
                    </span>
                  }>
                  <InformationCircleIcon className="w-3 inline -mt-1 opacity-50" />
                </Tooltip>
              </Text>
            )}
            {isOpenAIAPI && (
              <Text dimming="less" size="xs">
                Note: you must be on a{" "}
                <a
                  href={"https://platform.openai.com/account/billing/overview"}
                  target="_blank"
                  className="font-bold"
                  rel="noreferrer">
                  paid account
                </a>
                .
              </Text>
            )}
            {isLocalModel && (
              <Text dimming="less" size="xs">
                Set up Alpaca on your computer{" "}
                <a
                  href={
                    "https://github.com/alexanderatallah/Alpaca-Turbo#using-the-api"
                  }
                  target="_blank"
                  className="font-bold"
                  rel="noreferrer">
                  here
                </a>
                .
              </Text>
            )}
            <Accordion title="Advanced" initiallyOpened={isLocalModel}>
              <Input
                placeholder="Base URL"
                type="url"
                name="base-url"
                value={url || config?.baseUrl || ""}
                onChange={(val) => setUrl(val)}
                onBlur={saveAll}
              />
              <label
                htmlFor={"base-url"}
                className="block text-xs font-medium opacity-60 mt-2">
                {isLocalModel
                  ? "Use any base URL, including localhost."
                  : "Optionally use this to set a proxy. Only change if you know what you're doing."}
              </label>
            </Accordion>
          </div>
        </Well>
      </div>
    </div>
  )
}

function ExternalSettings({ config }: { config: Config }) {
  return (
    <div>
      {config.session ? (
        <div className="flex flex-col justify-between">
          <table className="table-fixed mt-2">
            <tbody>
              {objectEntries(config.session).map(([k, v]) => (
                <tr key={k}>
                  <td className="text-xs opacity-30">{k}</td>
                  <td className="text-xs opacity-60">
                    {typeof v === "string"
                      ? v
                      : k === "expiresAt" && v
                      ? new Date(v * 1000).toLocaleString()
                      : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-6"></div>
          <Button
            appearance="secondary"
            wide
            onClick={() =>
              window.open(configManager.getExternalConfigURL(config), "_blank")
            }>
            Manage
          </Button>
        </div>
      ) : (
        <Button
          appearance="primary"
          wide
          onClick={() =>
            window.open(configManager.getExternalConfigURL(config), "_blank")
          }>
          Sign Up
        </Button>
      )}
    </div>
  )
}
