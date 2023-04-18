// ModelID is an enum of the available models.
// NOTE: this is an evolving standard, and may change in the future.
export enum ModelID {
  GPT3 = "openai/gpt3.5",
  GPT4 = "openai/gpt4",
  Together = "together/gpt-neoxt-20B",
  Cohere = "cohere/xlarge",
  Local = "local"
}
