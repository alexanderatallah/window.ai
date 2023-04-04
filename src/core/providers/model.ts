import { createProvider } from "puro"
import { useContext, useState } from "react"

import { ModelID } from "~public-interface"

const useModelProvider = () => {
  const [modelId, setModelId] = useState<ModelID>(ModelID.GPT3)

  return {
    modelId,
    setModelId
  }
}

const { BaseContext, Provider } = createProvider(useModelProvider)

export const ModelProvider = Provider
export const useModel = () => useContext(BaseContext)
