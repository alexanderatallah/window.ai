import { InformationCircleIcon } from "@heroicons/react/24/outline"
import { useEffect, useMemo, useState } from "react"
import { ErrorCode, ModelID } from "window.ai"

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
import { isOk } from "~core/utils/result-monad"
import { camelToWords, objectEntries } from "~core/utils/utils"

type ConfigSetting = { auth: AuthType; model?: ModelID }

const configSettings: ConfigSetting[] = [
  { auth: AuthType.External }, // OpenRouter
  { auth: AuthType.APIKey, model: ModelID.GPT_3 },
  { auth: AuthType.APIKey, model: ModelID.GPT_4 },
  { auth: AuthType.APIKey, model: ModelID.Claude_Instant_V1 },
  { auth: AuthType.APIKey, model: ModelID.Claude_V1_100k },
  { auth: AuthType.APIKey, model: ModelID.Together },
  { auth: AuthType.APIKey, model: ModelID.Cohere },
  { auth: AuthType.APIKey } // Local model
]

export function Settings(props: { onHide: () => void }) {
  const { config, setConfig } = useConfig()
  const { data } = usePermissionPort()
  const { requestId } = useParams()
  const [apiKey, setApiKey] = useState("")
  const [url, setUrl] = useState("")
  const [urlPlaceholder, setUrlPlaceholder] = useState("Base URL")

  // Only show dropdown if there is no permission request
  // or if the permission request is for the default model
  const showDefaultConfigDropdown =
    !data || ("requester" in data && !data.requester.transaction.model)

  useEffect(() => {
    setApiKey(config?.apiKey || "")
    setUrl(config?.baseUrl || "")
    config && configManager.getBaseUrl(config).then(setUrlPlaceholder)
  }, [config])

  async function saveDefaultConfig(authType: AuthType, modelId?: ModelID) {
    const config = await configManager.getOrInit(authType, modelId)
    await configManager.setDefault(config)
    setConfig(config)
  }

  async function saveAll() {
    if (!config) {
      return
    }
    return configManager.save({
      ...config,
      apiKey: apiKey || undefined,
      baseUrl: url || undefined
    })
  }

  async function handleSaveAction() {
    await saveAll()
    props.onHide()
  }

  const isLocalModel = config && configManager.isLocal(config)
  const needsAPIKey = config?.auth === AuthType.APIKey
  const asksForAPIKey = needsAPIKey || isLocalModel // Some local models need keys, e.g. https://github.com/keldenl/gpt-llama.cpp
  const isExternal = config?.auth === AuthType.External
  const isOpenAIAPI = useMemo(
    () =>
      needsAPIKey && !!config?.models.find((m) => m.split("/")[0] === "openai"),
    [needsAPIKey, config]
  )

  return (
    <div className="flex flex-col">
      <Text size="lg" strength="bold">
        Configuration
      </Text>
      <div className="my-4">
        {requestId ? (
          <div className="bg-rose-700 dark:text-rose-300 text-white rounded-md py-4 px-6">
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
              <div className="flex items-center gap-2">
                <Input
                  placeholder="API Key"
                  value={apiKey || ""}
                  onChange={(val) => setApiKey(val)}
                  onBlur={saveAll}
                  onEnter={handleSaveAction}
                />
                {Boolean(apiKey) && (
                  <div className="relative top-1">
                    <Button onClick={handleSaveAction}>Save</Button>
                  </div>
                )}
              </div>
            )}
            {isExternal && <ExternalSettings config={config} />}
            <div className="mt-3"></div>
            {needsAPIKey && !isLocalModel && (
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
                    <span>API keys are only stored in your browser.</span>
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
                . Use OpenRouter if you do not have one.
              </Text>
            )}
            {isLocalModel && (
              <Text dimming="less" size="xs">
                Set up local.ai on your computer{" "}
                <a
                  href={"https://localai.app/"}
                  target="_blank"
                  className="font-bold"
                  rel="noreferrer">
                  here
                </a>
                .
              </Text>
            )}
            {!isExternal && (
              <Accordion title="Advanced" initiallyOpened={isLocalModel}>
                <Input
                  placeholder={urlPlaceholder}
                  type="url"
                  name="base-url"
                  value={url}
                  onChange={(val) => setUrl(val)}
                  onBlur={saveAll}
                />
                <label
                  htmlFor={"base-url"}
                  className="block text-xs font-medium opacity-60 mt-2">
                  {isLocalModel
                    ? "Use any base URL, including localhost."
                    : "Optionally set a proxy, or use the model's original base URL."}
                </label>
              </Accordion>
            )}
          </div>
        </Well>
      </div>
    </div>
  )
}

function ExternalSettings({ config }: { config: Config }) {
  const [defaultModel, setDefaultModel] = useState<string>()
  const [shouldLogInAgain, setShouldLogInAgain] = useState<boolean>(false)

  useEffect(() => {
    async function loadDefaultModel() {
      if (configManager.getModel(config)) {
        return
      }
      const res = await configManager.predictModel(config)
      if (isOk(res)) {
        setDefaultModel(res.data)
      } else if (res.error === ErrorCode.NotAuthenticated) {
        setShouldLogInAgain(true)
      }
    }
    loadDefaultModel()
  }, [])

  const { session } = config
  return (
    <div>
      {session ? (
        <div className="flex flex-col justify-between">
          <table className="table-fixed mt-2 w-full">
            <tbody>
              {objectEntries(session)
                .filter(([attr]) => ["email", "walletAddress"].includes(attr))
                .map(([attr, val]) => (
                  <tr key={attr} className="grid grid-cols-7">
                    <td className="text-xs opacity-30 truncate col-span-2">
                      {camelToWords(attr)}
                    </td>
                    <td className="text-xs opacity-60 truncate col-span-5">
                      {val}
                    </td>
                  </tr>
                ))}
              <tr className="grid grid-cols-7">
                <td className="text-xs opacity-30 truncate col-span-2">
                  route
                </td>
                <td
                  className={
                    "text-xs opacity-60 truncate col-span-5 " +
                    (shouldLogInAgain
                      ? "text-rose-700 dark:text-rose-300 "
                      : "")
                  }>
                  {defaultModel ??
                    (shouldLogInAgain ? (
                      "error: click Manage to fix"
                    ) : (
                      <span className="opacity-30">loading...</span>
                    ))}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="mt-6"></div>
          <Button
            appearance="secondary"
            wide
            onClick={() => {
              window.open(configManager.getExternalConfigURL(config), "_blank")
              window.close()
            }}>
            Manage
          </Button>
        </div>
      ) : (
        <div>
          <Text dimming="less">
            Easiest way to access OpenAI and Anthropic models.
          </Text>
          <div className="mt-4"></div>
          <Button
            appearance="primary"
            wide
            onClick={() => {
              window.open(configManager.getExternalConfigURL(config), "_blank")
              window.close()
            }}>
            Sign in
          </Button>
        </div>
      )}
    </div>
  )
}
