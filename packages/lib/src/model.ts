// ModelID is an enum of the available models.
// NOTE: this is an evolving standard, and may change in the future.
export enum ModelID {
  // OpenAI models
  GPT_3 = "openai/gpt-3.5-turbo",
  GPT_4 = "openai/gpt-4",
  // Anthropic models
  Claude_Instant_V1 = "anthropic/claude-instant-v1",
  Claude_Instant_V1_100k = "anthropic/claude-instant-v1-100k",
  Claude_V1 = "anthropic/claude-v1",
  Claude_V1_100k = "anthropic/claude-v1-100k",
  // Other
  Together = "togethercomputer/GPT-NeoXT-Chat-Base-20B",
  Cohere = "cohere/command-nightly",
  // Media Models
  Shap_e = "openrouter/shap_e",
}

// Older namings that will be deprecated
const DeprecatedModelID = {
  "openai/gpt3.5": ModelID.GPT_3,
  "openai/gpt4": ModelID.GPT_4,
  "together/gpt-neoxt-20B": ModelID.Together,
  "cohere/xlarge": ModelID.Cohere
}

/**
 * parseModelID parses a raw model ID string into a ModelID enum.
 * @param rawModelId The raw model ID string to parse.
 * @returns The parsed ModelID enum, or undefined if the rawModelId is invalid.
 */
export function parseModelID(rawModelId: string): ModelID | undefined {
  if (rawModelId in DeprecatedModelID) {
    return DeprecatedModelID[rawModelId as keyof typeof DeprecatedModelID]
  }
  if (Object.values(ModelID).includes(rawModelId as ModelID)) {
    return rawModelId as ModelID
  }
  return undefined
}
