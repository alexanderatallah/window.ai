import { InformationCircleIcon } from "@heroicons/react/24/outline"
import { useEffect, useState } from "react"

import { Accordion } from "~core/components/pure/Accordion"
import { Dropdown } from "~core/components/pure/Dropdown"
import { Input } from "~core/components/pure/Input"
import { Splitter } from "~core/components/pure/Splitter"
import { Text } from "~core/components/pure/Text"
import Tooltip from "~core/components/pure/Tooltip"
import { Well } from "~core/components/pure/Well"
import type { Config } from "~core/managers/config"
import { configManager } from "~core/managers/config"
import { useModel } from "~core/providers/model"
import { ModelID } from "~public-interface"

const APIKeyURL: { [K in ModelID]: string | undefined } = {
  [ModelID.GPT3]: "https://platform.openai.com/account/api-keys",
  [ModelID.GPT4]: "https://platform.openai.com/account/api-keys",
  [ModelID.Together]: undefined,
  [ModelID.Cohere]: "https://dashboard.cohere.ai/api-keys",
  [ModelID.Local]: undefined
}

export function Settings() {
  // const [loading, setLoading] = useState(false)
  const { modelId, setModelId } = useModel()
  const [apiKey, setApiKey] = useState("")
  const [url, setUrl] = useState("")
  const [config, setConfig] = useState<Config | undefined>()
  const [defaultModel, setDefaultModel] = useState<ModelID>(modelId)

  useEffect(() => {
    configManager.get(modelId).then((c) => {
      const config = c || configManager.init(modelId)
      setConfig(config)
    })
  }, [modelId])

  useEffect(() => {
    configManager.getDefault().then((c) => {
      setDefaultModel(c.id)
      setModelId(c.id)
    })
  }, [])

  useEffect(() => {
    setApiKey(config?.apiKey || "")
    setUrl(config?.baseUrl || "")
  }, [config])

  async function saveDefaultModel(id: ModelID) {
    setDefaultModel(id)
    setModelId(id)
    await configManager.setDefault(id)
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

  const isLocalModel = modelId === ModelID.Local
  const isOpenAI = modelId === ModelID.GPT3 || modelId === ModelID.GPT4

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
            Default model
          </Text>
        </div>
        <Splitter />
        <Dropdown<ModelID>
          styled
          choices={Object.values(ModelID)}
          onSelect={saveDefaultModel}>
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
            {APIKeyURL[modelId] && (
              <Text dimming="less" size="xs">
                {apiKey ? "Monitor your" : "Obtain an"} API key{" "}
                <a
                  href={APIKeyURL[modelId]}
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
            {isOpenAI && (
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
