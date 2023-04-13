import { Storage } from "@plasmohq/storage"

import { PortName } from "~core/constants"
import { Extension } from "~core/extension"
import { EventType, ModelID } from "~public-interface"

import { BaseManager } from "./base"

export const LLMLabels: { [K in ModelID]: string } = {
  [ModelID.GPT3]: "OpenAI: GPT-3.5",
  [ModelID.GPT4]: "OpenAI: GPT-4",
  [ModelID.GPTNeo]: "Together: GPT NeoXT 20B",
  [ModelID.Cohere]: "Cohere: Xlarge",
  [ModelID.Alpaca7B]: "Local"
}

export const DefaultCompletionURL: { [K in ModelID]: string } = {
  [ModelID.GPT3]: "https://api.openai.com/v1/completions",
  [ModelID.GPT4]: "https://api.openai.com/v1/completions",
  [ModelID.GPTNeo]: "https://api.together.xyz/inference",
  [ModelID.Cohere]: "https://api.cohere.ai/generate",
  [ModelID.Alpaca7B]: "http://127.0.0.1:8000/completions"
}

export const APIKeyURL: { [K in ModelID]: string | undefined } = {
  [ModelID.GPT3]: "https://platform.openai.com/account/api-keys",
  [ModelID.GPT4]: "https://platform.openai.com/account/api-keys",
  [ModelID.GPTNeo]: undefined,
  [ModelID.Cohere]: "https://dashboard.cohere.ai/api-keys",
  [ModelID.Alpaca7B]: undefined
}

export interface Config {
  id: ModelID
  apiKey?: string
  completionUrl?: string
}

class ConfigManager extends BaseManager<Config> {
  protected defaultConfig: Storage

  constructor() {
    super("configs")

    this.defaultConfig = new Storage({
      area: "local"
    })
    this.defaultConfig.setNamespace(`configs-default-`)
  }

  init(id: ModelID): Config {
    return {
      id,
      completionUrl: DefaultCompletionURL[id]
    }
  }

  isIncomplete(config: Config): boolean {
    return (
      !config.completionUrl ||
      (![ModelID.Alpaca7B, ModelID.GPTNeo].includes(config.id) &&
        !config.apiKey)
    )
  }

  async setDefault(id: ModelID) {
    const previous = (await this.defaultConfig.get("id")) as ModelID | undefined
    await this.defaultConfig.set("id", id)
    if (previous !== id) {
      Extension.sendRequest(PortName.Events, {
        request: {
          event: EventType.ModelChanged,
          data: { model: id }
        }
      })
    }
  }

  async getDefault(): Promise<Config> {
    let id = (await this.defaultConfig.get("id")) as ModelID | undefined
    if (!id) {
      id = ModelID.GPT3
      await this.setDefault(id)
    }
    return (await this.get(id)) || this.init(id)
  }
}

export const configManager = new ConfigManager()
