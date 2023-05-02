import { createProvider } from "puro"
import { useContext, useEffect, useState } from "react"

import { type Config, configManager } from "~core/managers/config"

const useConfigProvider = () => {
  const [config, setConfig] = useState<Config | undefined>()

  useEffect(() => {
    const initConfigWithDefault = async () => {
      const config = await configManager.getDefault()
      setConfig(config)
    }
    initConfigWithDefault()
  }, [])

  return {
    config,
    setConfig
  }
}

const { BaseContext, Provider } = createProvider(useConfigProvider)

export const ConfigProvider = Provider
export const useConfig = () => useContext(BaseContext)
