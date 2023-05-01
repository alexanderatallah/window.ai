import { v4 as uuidv4 } from "uuid"
import { EventType } from "window.ai"

import { Storage } from "@plasmohq/storage"

import { PortName } from "~core/constants"
import { Extension } from "~core/extension"
import { local, modelAPICallers, openrouter } from "~core/llm"
import { ModelID, isKnownModel } from "~public-interface"

import { BaseManager } from "./base"

export enum AuthType {
  // Let another site handle all authentication
  External = "external",
  // Use an API key
  APIKey = "key"
}

const APIKeyURL: Record<ModelID, string> = {
  [ModelID.GPT3]: "https://platform.openai.com/account/api-keys",
  [ModelID.GPT4]: "https://platform.openai.com/account/api-keys",
  [ModelID.Together]: "https://api.together.xyz/",
  [ModelID.Cohere]: "https://dashboard.cohere.ai/api-keys"
}

const defaultAPILabel: Record<ModelID, string> = {
  [ModelID.GPT3]: "OpenAI: GPT-3.5",
  [ModelID.GPT4]: "OpenAI: GPT-4",
  [ModelID.Together]: "Together: GPT NeoXT 20B",
  [ModelID.Cohere]: "Cohere: Xlarge"
}

const authIndexName = "byAuth"

// TODO add `params` with model-specific params
export interface Config {
  id: string
  auth: AuthType
  label: string
  baseUrl: string
  models: ModelID[]

  authMetadata?: { email?: string; expiresAt?: number }
  apiKey?: string
}

class ConfigManager extends BaseManager<Config> {
  protected defaultConfig: Storage
  protected modelHandlers: Storage

  constructor() {
    super("configs", "sync")

    // Just store the id of the default config
    this.defaultConfig = new Storage({
      area: "sync"
    })
    this.defaultConfig.setNamespace(`configs-default-`)

    // For each ModelID, store the id of the config that handles it
    this.modelHandlers = new Storage({
      area: "sync"
    })
    this.modelHandlers.setNamespace(`configs-model-handlers-`)
  }

  init(auth: AuthType, modelId?: ModelID): Config {
    const id = uuidv4()
    const caller = this.getCallerForAuth(auth, modelId)
    const label = this.getLabelForAuth(auth, modelId)
    switch (auth) {
      case AuthType.External:
        return {
          id,
          auth,
          label,
          models: [ModelID.GPT3, ModelID.GPT4],
          baseUrl: caller.config.defaultBaseUrl
        }
      case AuthType.APIKey:
        return {
          id,
          auth,
          models: modelId ? [modelId] : [],
          baseUrl: caller.config.defaultBaseUrl,
          label
        }
    }
  }

  async save(config: Config): Promise<boolean> {
    const isNew = await super.save(config)

    if (isNew) {
      // Index by auth type
      await this.indexBy(config, config.auth, authIndexName)
    }

    for (const modelId of config.models) {
      await this.modelHandlers.set(modelId, config.id)
    }

    return isNew
  }

  async forModel(modelId: ModelID): Promise<Config> {
    const configId = await this.modelHandlers.get(modelId)
    if (configId) {
      const config = await this.get(configId)
      if (config) {
        const defaults = this.init(config.auth, modelId)
        return {
          ...defaults,
          ...config
        }
      }
      await this.modelHandlers.remove(modelId)
    }
    // TODO include Token auth possibilities?
    return this.init(AuthType.APIKey, modelId)
  }

  isCredentialed(config: Config): boolean {
    if (!config.baseUrl) {
      return false
    }
    switch (config.auth) {
      case AuthType.External:
        return !!config.authMetadata
      case AuthType.APIKey:
        return config.models.length ? !!config.apiKey : true
    }
  }

  async setDefault(config: Config) {
    await this.save(config)
    const previous = await this.defaultConfig.get("id")
    await this.defaultConfig.set("id", config.id)
    if (previous !== config.id) {
      Extension.sendToBackground(PortName.Events, {
        request: {
          event: EventType.ModelChanged,
          data: { model: configManager.getCurrentModel(config) }
        }
      })
    }
  }

  async getDefault(): Promise<Config> {
    const id = (await this.defaultConfig.get("id")) as string | undefined
    if (id) {
      const config = await this.get(id)
      if (config) {
        return config
      }
      await this.defaultConfig.remove("id")
    }
    return this.init(AuthType.External)
  }

  // TODO: allow multiple custom models
  async forModelWithDefault(model?: string): Promise<Config> {
    if (!model) {
      return this.getDefault()
    }
    if (isKnownModel(model)) {
      return this.forModel(model)
    }
    // TEMP: Handle unknown models using one custom model
    const configs = await this.filter({
      auth: AuthType.APIKey,
      model: null
    })
    if (configs.length > 0) {
      return configs[0]
    }
    return this.init(AuthType.APIKey)
  }

  // Filtering for `null` looks for configs that don't have any models
  async filter({
    auth,
    model
  }: {
    auth: AuthType
    model?: ModelID | null
  }): Promise<Config[]> {
    const ids = await this.getIds(100, 0, authIndexName, auth)
    const maybeConfigs = await Promise.all(ids.map((id) => this.get(id)))
    const configs = maybeConfigs.filter((c) => c !== undefined) as Config[]
    return configs.filter((c) =>
      model === null
        ? c.models.length === 0
        : model
        ? c.models.includes(model)
        : true
    )
  }

  async forAuthAndModel(auth: AuthType, modelId?: ModelID) {
    const forAuth = await this.filter({ auth })
    if (!modelId) {
      return forAuth[0]
    }
    return forAuth.find((c) => c.models.includes(modelId))
  }

  getCallerForAuth(auth: AuthType, modelId?: ModelID) {
    switch (auth) {
      case AuthType.External:
        return openrouter
      case AuthType.APIKey:
        return modelId ? modelAPICallers[modelId] : local
    }
  }

  getLabelForAuth(auth: AuthType, modelId?: ModelID) {
    switch (auth) {
      case AuthType.External:
        return "OpenRouter"
      case AuthType.APIKey:
        return modelId ? defaultAPILabel[modelId] : "Local"
    }
  }

  getCaller(config: Config) {
    return this.getCallerForAuth(config.auth, this.getCurrentModel(config))
  }

  getCurrentModel(config: Config): ModelID | undefined {
    // TODO: support multiple models per config
    if (config.models.length > 1) {
      return undefined
    }
    return config.models[0]
  }

  getExternalConfigURL(config: Config) {
    switch (config.auth) {
      case AuthType.External:
        return (
          (process.env.PLASMO_PUBLIC_OPENROUTER_URI ||
            "https://openrouter.ai") + "/signin"
        )
      case AuthType.APIKey:
        const model = this.getCurrentModel(config)
        if (!model) {
          // Assume local model
          return "https://github.com/alexanderatallah/window.ai#-local-model-setup"
        }
        return APIKeyURL[model]
    }
  }
}

export const configManager = new ConfigManager()
