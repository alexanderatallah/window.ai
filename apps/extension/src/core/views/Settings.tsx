import { InformationCircleIcon } from "@heroicons/react/24/outline"
import { useEffect, useState } from "react"

import { Accordion } from "~core/components/pure/Accordion"
import { Dropdown } from "~core/components/pure/Dropdown"
import { Input } from "~core/components/pure/Input"
import { Splitter } from "~core/components/pure/Splitter"
import { Text } from "~core/components/pure/Text"
import Tooltip from "~core/components/pure/Tooltip"
import { Well } from "~core/components/pure/Well"
import { AuthType, type Config } from "~core/managers/config"
import { configManager } from "~core/managers/config"
import { useConfig } from "~core/providers/config"
import { ModelID } from "~public-interface"

type ConfigSetting = { auth: AuthType; model?: ModelID }

const configSettings: ConfigSetting[] = [
  { auth: AuthType.Token },
  { auth: AuthType.APIKey, model: ModelID.GPT3 },
  { auth: AuthType.APIKey, model: ModelID.GPT4 },
  { auth: AuthType.APIKey, model: ModelID.Together },
  { auth: AuthType.APIKey, model: ModelID.Cohere },
  { auth: AuthType.None }
]

const APIKeyURL: { [K in ModelID]: string } = {
  [ModelID.GPT3]: "https://platform.openai.com/account/api-keys",
  [ModelID.GPT4]: "https://platform.openai.com/account/api-keys",
  [ModelID.Together]: "https://api.together.xyz/",
  [ModelID.Cohere]: "https://dashboard.cohere.ai/api-keys"
}

export function Settings() {
  const { config, setConfig } = useConfig()
  const [apiKey, setApiKey] = useState("")
  const [url, setUrl] = useState("")
  // const [defaultModel, setDefaultModel] = useState<ModelID | undefined>()

  // useEffect(() => {
  //   async function loadConfig() {
  //     const c = await configManager.getOrInit(modelId)
  //     setConfig(c)
  //   }
  //   loadConfig()
  // }, [modelId])

  // useEffect(() => {
  //   async function loadDefault() {
  //     const c = await configManager.getDefault()
  //     setDefaultModel(c.id)
  //     setModelId(c.id)
  //   }
  //   loadDefault()
  // }, [config])

  useEffect(() => {
    setApiKey(config?.apiKey || "")
    setUrl(config?.baseUrl || "")
  }, [config])

  async function saveDefaultConfig(authType: AuthType, modelId?: ModelID) {
    const config =
      (await configManager.forAuthAndModel(authType, modelId)) ||
      configManager.init(authType, modelId)
    await configManager.save(config)
    await configManager.setDefault(config)
    // setDefaultModel(id)
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

  const isLocalModel = config?.auth === AuthType.None
  const needsAPIKey =
    config?.auth === AuthType.APIKey && config.models[0] !== ModelID.Together
  const isOpenAIAPI =
    config?.auth === AuthType.APIKey &&
    !!config?.models.find((m) => m === ModelID.GPT3 || m === ModelID.GPT4)

  return (
    <div className="flex flex-col">
      <Text size="lg" strength="bold">
        Configuration
      </Text>
      <div className="my-4">
        <Text size="xs" dimming="less">
          Change your model settings here.
        </Text>
      </div>
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
      <div className="py-4">
        <Well>
          <div className="-my-3 flex flex-row justify-between">
            <Text strength="medium" dimming="less">
              Settings:
            </Text>
            <Text align="right" strength="medium" dimming="more">
              {config?.label}
            </Text>
          </div>

          <Splitter />

          <div className="">
            {!isLocalModel && (
              <Input
                placeholder="API Key"
                value={apiKey || ""}
                onChange={(val) => setApiKey(val)}
                onBlur={saveAll}
              />
            )}
            <div className="mt-3"></div>
            {needsAPIKey && (
              <Text dimming="less" size="xs">
                {apiKey ? "Monitor your" : "Obtain an"} API key{" "}
                <a
                  href={APIKeyURL[config.models[0]]}
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
