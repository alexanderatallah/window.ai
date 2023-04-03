import { useEffect, useState } from "react"

import { Accordion } from "~core/components/pure/Accordion"
import { Dropdown } from "~core/components/pure/Dropdown"
import { Input } from "~core/components/pure/Input"
import { Splitter } from "~core/components/pure/Splitter"
import { Text } from "~core/components/pure/Text"
import Tooltip from "~core/components/pure/Tooltip"
import { Well } from "~core/components/pure/Well"
import {
  Config,
  DefaultCompletionURL,
  LLMLabels,
  configManager
} from "~core/managers/config"
import { ModelID } from "~public-interface"

export function Settings() {
  // const [loading, setLoading] = useState(false)
  const uiDefaultModel = ModelID.GPT3
  const [selectedModel, setSelectedModel] = useState<ModelID>(uiDefaultModel)
  const [apiKey, setApiKey] = useState("")
  const [url, setUrl] = useState("")
  const [config, setConfig] = useState<Config | undefined>()
  const [defaultModel, setDefaultModel] = useState<ModelID>(uiDefaultModel)

  useEffect(() => {
    configManager.get(selectedModel).then((c) => {
      const config = c || configManager.init(selectedModel)
      setConfig(config)
    })
  }, [selectedModel])

  useEffect(() => {
    configManager.getDefault().then((c) => {
      setDefaultModel(c.id)
      setSelectedModel(c.id)
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

  const isLocalModel = selectedModel === ModelID.Local

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
                An API key is required for external models like OpenAI, but not
                for ones running locally on your computer.
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
            setSelectedModel(id)
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
            onSelect={(v) => setSelectedModel(v)}>
            {LLMLabels[selectedModel]}
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
            <Accordion title="Advanced" initiallyOpened={isLocalModel}>
              <Input
                placeholder="URL"
                type="url"
                name="completion-url"
                value={url || DefaultCompletionURL[selectedModel]}
                onChange={(val) => setUrl(val)}
                onBlur={saveAll}
              />
              <label
                htmlFor={"completion-url"}
                className="block text-xs font-medium opacity-60 mt-2">
                {selectedModel === ModelID.Local
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
