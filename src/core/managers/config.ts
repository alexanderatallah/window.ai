import { BaseManager } from "./base"

export enum LLM {
  GPT3 = "openai/gpt3",
  GPTNeo = "together/gpt-neo",
  Cohere = "cohere",
  Local = "local"
}

export const LLMLabels = {
  [LLM.GPT3]: "OpenAI: GPT-3",
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
  constructor() {
    super("configs")
  }

  init(id: LLM): Config {
    return {
      id,
      completionUrl: DefaultCompletionURL[id]
    }
  }
}

export const configManager = new ConfigManager()
