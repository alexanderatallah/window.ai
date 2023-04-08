import { useEffect, useState } from "react"

import { Accordion } from "~core/components/pure/Accordion"
import { Dropdown } from "~core/components/pure/Dropdown"
import { Input } from "~core/components/pure/Input"
import { Splitter } from "~core/components/pure/Splitter"
import { Text } from "~core/components/pure/Text"
import Tooltip from "~core/components/pure/Tooltip"
import { Well } from "~core/components/pure/Well"
import {
  APIKeyURL,
  Config,
  DefaultCompletionURL,
  LLMLabels,
  configManager
} from "~core/managers/config"
import { useModel } from "~core/providers/model"
import { ModelID } from "~public-interface"

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
    setUrl(config?.completionUrl || "")
  }, [config])

  async function saveAll() {
    if (!config) {
      return
    }
    return configManager.save({
      ...config,
      apiKey: apiKey
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
          Change your model settings here. API keys are only stored in your
          browser.{" "}
          <Tooltip
            content={
              <span>
                An API key is required for the OpenAI and Cohere models, but not
                for Together or Local (running on your computer).
                <br />
                <br />
                For OpenAI, you must have a paid account, otherwise your key
                will be rate-limited excessively.
              </span>
            }>
            Learn more
          </Tooltip>
          .
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
          onSelect={async (id) => {
            await configManager.setDefault(id)
            setDefaultModel(id)
            setModelId(id)
          }}>
          {LLMLabels[defaultModel]}
        </Dropdown>
      </Well>
      <div className="py-4">
        <Well>
          <div className="-my-3">
            <Text strength="medium" dimming="less">
              Model settings
            </Text>
          </div>
          <Splitter />
          <Dropdown<ModelID>
            choices={Object.values(ModelID)}
            onSelect={(v) => setModelId(v)}>
            {LLMLabels[modelId]}
          </Dropdown>

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
                </a>
                .
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
                placeholder="URL"
                type="url"
                name="completion-url"
                value={url || DefaultCompletionURL[modelId]}
                onChange={(val) => setUrl(val)}
                onBlur={saveAll}
              />
              <label
                htmlFor={"completion-url"}
                className="block text-xs font-medium opacity-60 mt-2">
                {isLocalModel
                  ? "Use any URL, including localhost!"
                  : "Optionally use this to set a proxy. Only change if you know what you're doing."}
              </label>
            </Accordion>
          </div>
        </Well>
      </div>
    </div>
  )
}
