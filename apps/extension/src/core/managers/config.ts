import { Storage } from "@plasmohq/storage"

import { PortName } from "~core/constants"
import { Extension } from "~core/extension"
import { EventType, ModelID } from "~public-interface"
import { type TemplateID, Templates } from "~templates"
import type { ModelAPI, RequestOptions } from "~templates/base/model-api"

import { BaseManager } from "./base"

export const LLMLabels: { [K in ModelID]: string } = {
  [ModelID.GPT3]: "OpenAI: GPT-3.5",
  [ModelID.GPT4]: "OpenAI: GPT-4",
  [ModelID.Together]: "Together: GPT NeoXT 20B",
  [ModelID.Cohere]: "Cohere: Xlarge"
}

export const DefaultCompletionURL: { [K in ModelID]: string } = {
  [ModelID.GPT3]: "https://api.openai.com/v1/completions",
  [ModelID.GPT4]: "https://api.openai.com/v1/completions",
  [ModelID.Together]: "https://api.together.xyz/inference",
  [ModelID.Cohere]: "https://api.cohere.ai/generate"
  // [ModelID.Local]: "http://127.0.0.1:8000/completions"
}

export const APIKeyURL: { [K in ModelID]: string | undefined } = {
  [ModelID.GPT3]: "https://platform.openai.com/account/api-keys",
  [ModelID.GPT4]: "https://platform.openai.com/account/api-keys",
  [ModelID.Together]: undefined,
  [ModelID.Cohere]: "https://dashboard.cohere.ai/api-keys"
  // [ModelID.Local]: undefined
}

export interface Config {
  id: ModelID
  apiKey?: string
  baseUrl?: string
  params?: RequestOptions // TODO make required
  template?: TemplateID // TODO make required
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
    const templates: { [k in ModelID]: TemplateID } = {
      [ModelID.GPT3]: "OpenAI",
      [ModelID.GPT4]: "OpenAI",
      [ModelID.Together]: "Together",
      [ModelID.Cohere]: "Cohere"
    }
    return {
      id,
      template: templates[id],
      params: {}
      // baseUrl: DefaultCompletionURL[id]
    }
  }

  getModelParams(config: Config): {
    template: ModelAPI
    params: RequestOptions
  } {
    return {
      template: Templates[config.template || "Local"],
      params: config.params || {}
    }
  }

  isIncomplete(config: Config): boolean {
    return (
      !config.baseUrl ||
      (![ModelID.Together].includes(config.id) && !config.apiKey)
    )
  }

  async setDefault(id: ModelID) {
    const previous = (await this.defaultConfig.get("id")) as ModelID | undefined
    await this.defaultConfig.set("id", id)
    if (previous !== id) {
      Extension.sendToBackground(PortName.Events, {
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

  async getOrDefault(id?: ModelID): Promise<Config> {
    return id ? this.getOrInit(id) : this.getDefault()
  }
}

export const configManager = new ConfigManager()
