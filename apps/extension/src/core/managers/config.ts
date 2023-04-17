import { Storage } from "@plasmohq/storage"

import { PortName } from "~core/constants"
import { Extension } from "~core/extension"
import { modelCallers } from "~core/llm"
import { EventType, ModelID } from "~public-interface"

import { BaseManager } from "./base"

const defaultLabel: { [K in ModelID]: string } = {
  [ModelID.GPT3]: "OpenAI: GPT-3.5",
  [ModelID.GPT4]: "OpenAI: GPT-4",
  [ModelID.Together]: "Together: GPT NeoXT 20B",
  [ModelID.Cohere]: "Cohere: Xlarge",
  [ModelID.Local]: "Local"
}

// TODO add `params` with model-specific params
export interface Config {
  id: ModelID
  label: string
  baseUrl: string

  apiKey?: string
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
      baseUrl: modelCallers[id].config.defaultBaseUrl,
      label: defaultLabel[id]
    }
  }

  async get(id: ModelID): Promise<Config | undefined> {
    const obj = await super.get(id)
    const defaults = this.init(id)
    return {
      ...defaults,
      ...obj,
      baseUrl: obj?.baseUrl || defaults.baseUrl
    }
  }

  isIncomplete(config: Config): boolean {
    return (
      !config.baseUrl ||
      (![ModelID.Local, ModelID.Together].includes(config.id) && !config.apiKey)
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

  // TODO: allow multiple custom models
  async getWithDefault(model?: string): Promise<Config> {
    if (!model) {
      return this.getDefault()
    }
    if ((Object.values(ModelID) as string[]).includes(model)) {
      return this.getOrInit(model as ModelID)
    }
    return this.getOrInit(ModelID.Local)
  }
}

export const configManager = new ConfigManager()
