import { Storage } from "@plasmohq/storage"

import { BaseManager } from "./base"

export enum LLM {
  GPT3 = "openai/gpt3",
  GPTNeo = "together/gpt-neo",
  Cohere = "cohere",
  Local = "local"
}

export const LLMLabels = {
  [LLM.GPT3]: "OpenAI: GPT-3.5",
  [LLM.GPTNeo]: "Together: GPT Neo",
  [LLM.Cohere]: "Cohere",
  [LLM.Local]: "Local"
}

export const DefaultCompletionURL = {
  [LLM.GPT3]: "https://api.openai.com/v1/completions",
  [LLM.GPTNeo]: "https://api.together.xyz/inference",
  [LLM.Cohere]: "https://api.cohere.ai/generate",
  [LLM.Local]: "http://127.0.0.1:8000/completions"
}

export interface Config {
  id: LLM
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

  init(id: LLM): Config {
    return {
      id,
      completionUrl: DefaultCompletionURL[id]
    }
  }

  isIncomplete(config: Config): boolean {
    return (
      !config.completionUrl ||
      (![LLM.Local, LLM.GPTNeo].includes(config.id) && !config.apiKey)
    )
  }

  async getOrInit(id: LLM) {
    const config = await this.get(id)
    if (config) {
      return config
    }
    return this.init(id)
  }

  async setDefault(id: LLM) {
    await this.defaultConfig.set("id", id)
  }

  async getDefault(): Promise<Config> {
    const id = (await this.defaultConfig.get("id")) as LLM | undefined
    if (!id) {
      return this.init(LLM.GPT3)
    }
    return (await this.get(id)) || this.init(id)
  }
}

export const configManager = new ConfigManager()
