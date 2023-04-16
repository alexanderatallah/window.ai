import { InformationCircleIcon, PlusIcon } from "@heroicons/react/24/outline"
import { useEffect, useState } from "react"

import { Accordion } from "~core/components/pure/Accordion"
import { Button } from "~core/components/pure/Button"
import { Dropdown } from "~core/components/pure/Dropdown"
import { Input } from "~core/components/pure/Input"
import { Splitter } from "~core/components/pure/Splitter"
import { Text } from "~core/components/pure/Text"
import Tooltip from "~core/components/pure/Tooltip"
import { Well } from "~core/components/pure/Well"
import type { Config } from "~core/managers/config"
import {
  APIKeyURL,
  DefaultCompletionURL,
  LLMLabels,
  configManager
} from "~core/managers/config"
import { useModel } from "~core/providers/model"
import { ModelID } from "~public-interface"
import { type TemplateID, Templates } from "~templates"
import type { ModelAPI } from "~templates/base/model-api"

export function Settings() {
  // const [loading, setLoading] = useState(false)
  const { modelId, setModelId } = useModel()
  const [apiKey, setApiKey] = useState("")
  const [url, setUrl] = useState("")
  const [config, setConfig] = useState<Config | undefined>()
  const [defaultModel, setDefaultModel] = useState<ModelID>(modelId)
  const [template, setTemplate] = useState<ModelAPI>(Templates.OpenAI)
  const { objects } = configManager.useObjects()

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

  async function addConfig() {
    const newConfig = configManager.init(ModelID.GPT3)
    setConfig(newConfig)
    // setModelId(newConfig.id)
  }

  // TODO move this logic to model router
  const isLocalModel =
    template.config.baseUrl.includes("localhost") ||
    template.config.baseUrl.includes("127.0.0.1")
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
        <div className="-my-3 flex flex-row justify-between">
          <Text strength="medium" dimming="less">
            Default model
          </Text>
          <Button align="right" appearance="tertiary" onClick={addConfig}>
            <PlusIcon className="w-4 text-slate-600 -mx-6 -my-2" />
          </Button>
        </div>
        <Splitter />
        <Dropdown<ModelID>
          styled
          choices={objects.map((c) => c.id)}
          onSelect={async (id) => {
            setDefaultModel(id)
            setModelId(id)
            await configManager.setDefault(id)
          }}>
          {LLMLabels[defaultModel]}
        </Dropdown>
      </Well>
      <div className="py-4">
        <Well>
          <div className="-my-3 flex flex-row justify-between">
            <Text strength="medium" dimming="less">
              Settings:
            </Text>
            <Text align="right" inline strength="medium" dimming="more">
              {LLMLabels[modelId]}
            </Text>
          </div>
          <Splitter />
          <div className="flex flex-row justify-between">
            <div className="pt-2">
              <Text dimming="less" size="xs">
                Template:
              </Text>
            </div>
            <Dropdown
              choices={Object.keys(Templates) as TemplateID[]}
              onSelect={(t) => setTemplate(Templates[t])}>
              {template.config.modelProvider}
            </Dropdown>
          </div>

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
                    <span>API keys are only stored in your browser.</span>
                  }>
                  <InformationCircleIcon className="w-3 inline" />
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
