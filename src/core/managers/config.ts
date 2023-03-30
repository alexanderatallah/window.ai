import type { LLM } from "~core/constants"

import { BaseManager } from "./base"

export interface Config {
  id: LLM
  apiKey?: string
  completionUrl?: string
}

class ConfigManager extends BaseManager<Config> {
  constructor() {
    super("configs", "sync")
  }

  init(c: Config): Config {
    return c
  }
}

export const configManager = new ConfigManager()
