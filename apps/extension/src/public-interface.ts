// ModelID is an enum of the available models.
// NOTE: this is an evolving standard, and may change in the future.
export enum ModelID {
  GPT3 = "openai/gpt3.5",
  GPT4 = "openai/gpt4",
  Together = "together/gpt-neoxt-20B",
  Cohere = "cohere/xlarge"
}

export function isKnownModel(modelId: string): modelId is ModelID {
  return (Object.values(ModelID) as string[]).includes(modelId)
}
