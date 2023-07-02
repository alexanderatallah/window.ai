import { v4 as uuidv4 } from "uuid"
import {
  ErrorCode,
  EventType,
  ModelID,
  type ModelProviderOptions,
  parseModelID
} from "window.ai"

import { Storage } from "@plasmohq/storage"

import { PortName } from "~core/constants"
import { Extension } from "~core/extension"
import { getCaller } from "~core/llm"
import { type Result, ok } from "~core/utils/result-monad"
import { getExternalConfigURL } from "~core/utils/utils"

import * as modelRouter from "../model-router"
import { BaseManager } from "./base"
import type { Transaction } from "./transaction"

export enum AuthType {
  // Let another site handle all authentication
  External = "external",
  // Use an API key
  APIKey = "key"
}

const authIndexName = "byAuth"

// TODO add `params` with model-specific params
export interface Config {
  id: string
  auth: AuthType
  label: string
  models: ModelID[]

  session?: ModelProviderOptions["session"]
  baseUrl?: string
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
    const label = this.getLabelForAuth(auth, modelId)
    switch (auth) {
      case AuthType.External:
        return {
          id,
          auth,
          label,
          models: [
            ModelID.GPT_3,
            ModelID.GPT_3_16k,
            ModelID.GPT_4,
            ModelID.GPT_4_32k,
            ModelID.Claude_Instant_V1,
            ModelID.Claude_Instant_V1_100k,
            ModelID.Claude_V1,
            ModelID.Claude_V1_100k,
            ModelID.Shap_e,
            ModelID.Palm_Chat_Bison,
            ModelID.Palm_Code_Chat_Bison
          ]
        }
      case AuthType.APIKey:
        return {
          id,
          auth,
          models: modelId ? [modelId] : [],
          label
        }
    }
  }

  async get(id: string): Promise<Config | undefined> {
    const config = await super.get(id)
    if (config) {
      const defaultModels = this.init(config.auth, config.models[0]).models
      // HACK: Override old models with new defaults
      // we should probably just not store models in the config
      config.models = defaultModels
    }
    return config
  }

  async save(config: Config): Promise<boolean> {
    const isNew = await super.save(config)

    if (isNew) {
      // Index by auth type
      await this.indexBy(config, config.auth, authIndexName)
    }

    return isNew
  }

  async getOrInit(authType: AuthType, modelId?: ModelID): Promise<Config> {
    return (
      (await this.forAuthAndModel(authType, modelId)) ||
      this.init(authType, modelId)
    )
  }

  isCredentialed(config: Config): boolean {
    switch (config.auth) {
      case AuthType.External:
        return !!config.session
      case AuthType.APIKey:
        return config.models.length ? !!config.apiKey : true
    }
  }

  async setDefault(config: Config) {
    await this.save(config)
    for (const modelId of config.models) {
      await this.modelHandlers.set(modelId, config.id)
    }
    const previous = await this.defaultConfig.get("id")
    await this.defaultConfig.set("id", config.id)
    if (previous !== config.id) {
      Extension.sendToBackground(PortName.Events, {
        request: {
          event: EventType.ModelChanged,
          data: { model: configManager.getModel(config) }
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
    return this.getOrInit(AuthType.External)
  }

  // TODO: allow multiple custom models
  async forModelWithDefault(rawModel?: string): Promise<Config> {
    if (!rawModel) {
      return this.getDefault()
    }
    const model = parseModelID(rawModel)
    if (model) {
      return this._forModel(model)
    }
    // Local model handles unknowns
    return this.getOrInit(AuthType.APIKey)
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
    let forAuth: Config[]
    if (!modelId) {
      forAuth =
        auth === AuthType.APIKey
          ? await this.filter({ auth, model: null }) // Local model is special case (no model ID)
          : await this.filter({ auth })
    } else {
      forAuth = await this.filter({ auth, model: modelId })
    }
    return forAuth[0]
  }

  getLabelForAuth(auth: AuthType, modelId?: ModelID) {
    switch (auth) {
      case AuthType.External:
        return "OpenRouter"
      case AuthType.APIKey:
        return modelId ? defaultAPILabel(modelId) : "Local"
    }
  }

  isLocal(config: Config) {
    return config.auth === AuthType.APIKey && config.models.length === 0
  }

  async getModelCaller(config: Config) {
    const isOpenRouterAuthed = async () => {
      const c = await this.forAuthAndModel(AuthType.External)
      return c ? this.isCredentialed(c) : false
    }

    const canProxy =
      config.auth === AuthType.External ||
      // Only proxy w OpenRouter if user has authed and hasn't set a custom base url
      (!config.baseUrl && !this.isLocal(config) && (await isOpenRouterAuthed()))

    return getCaller(this.getModel(config), !canProxy)
  }

  async predictModel(
    config: Config,
    txn?: Transaction,
    shouldStream?: boolean
  ): Promise<Result<ModelID | string, ErrorCode | string>> {
    const currentModel = this.getModel(config)
    if (currentModel) {
      return ok(currentModel)
    }
    return modelRouter.route(config, txn, shouldStream)
  }

  getModel(config: Config): ModelID | undefined {
    if (config.models.length > 1) {
      return undefined
    }
    return config.models[0]
  }

  async getBaseUrl(config: Config) {
    if (config.baseUrl) {
      return config.baseUrl
    }
    const caller = await this.getModelCaller(config)
    return caller.config.defaultBaseUrl
  }

  getExternalConfigURL(config: Config) {
    switch (config.auth) {
      case AuthType.External:
        return config.session?.settingsUrl ?? getExternalConfigURL()
      case AuthType.APIKey:
        const model = this.getModel(config)
        if (!model) {
          // Assume local model
          return "https://github.com/alexanderatallah/window.ai#-local-model-setup"
        }
        return APIKeyURL(model)
    }
  }

  async _forModel(modelId: ModelID): Promise<Config> {
    const defaultConfigId = await this.modelHandlers.get(modelId)
    if (defaultConfigId) {
      const config = await this.get(defaultConfigId)
      if (config) {
        const defaults = this.init(config.auth, modelId)
        return {
          ...defaults,
          ...config
        }
      }
      await this.modelHandlers.remove(modelId)
    }
    // OpenRouter handles known, newly added models
    return this.getOrInit(AuthType.External)
  }
}

export const configManager = new ConfigManager()

function defaultAPILabel(model: ModelID): string {
  switch (model) {
    case ModelID.GPT_3:
      return "OpenAI: GPT-3.5 Turbo"
    case ModelID.GPT_3_16k:
      return "OpenAI: GPT-3.5 Turbo 16k"
    case ModelID.GPT_4:
      return "OpenAI: GPT-4"
    case ModelID.GPT_4_32k:
      return "OpenAI: GPT-4 32k"
    case ModelID.Together:
      return "Together: GPT NeoXT 20B"
    case ModelID.Cohere:
      return "Cohere: Command"
    case ModelID.Claude_Instant_V1:
      return "Anthropic: Claude Instant"
    case ModelID.Claude_Instant_V1_100k:
      return "Anthropic: Claude Instant 100k"
    case ModelID.Claude_V1:
      return "Anthropic: Claude"
    case ModelID.Claude_V1_100k:
      return "Anthropic: Claude 100k"
    case ModelID.Shap_e:
      return "OpenAI: Shap-E"
    case ModelID.Palm_Chat_Bison:
      return "Google: PaLM 2 Chat"
    case ModelID.Palm_Code_Chat_Bison:
      return "Google: PaLM 2 Code Chat"
  }
}

function APIKeyURL(model: ModelID): string {
  switch (model) {
    case ModelID.GPT_3:
    case ModelID.GPT_3_16k:
    case ModelID.GPT_4:
    case ModelID.GPT_4_32k:
      return "https://platform.openai.com/account/api-keys"
    case ModelID.Together:
      return "https://api.together.xyz/"
    case ModelID.Cohere:
      return "https://dashboard.cohere.ai/api-keys"
    case ModelID.Claude_Instant_V1:
    case ModelID.Claude_Instant_V1_100k:
    case ModelID.Claude_V1:
    case ModelID.Claude_V1_100k:
      return "https://console.anthropic.com/account/keys"
    case ModelID.Palm_Chat_Bison:
    case ModelID.Palm_Code_Chat_Bison:
      return "https://cloud.google.com/vertex-ai/docs/generative-ai/learn/models"
    case ModelID.Shap_e:
      return "https://openrouter.ai/keys"
  }
}
