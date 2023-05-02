import type { WebContainer } from "@webcontainer/api"
import { useWindowAI } from "~core/components/hooks/useWindowAI"
import { parseCmd } from "~core/utils/parser"
import { useLog } from "~features/agent/useLog"

const CONT_MESSAGE = "===CONTINUE_CODEAI==="

const END_INDICATOR = "===END_OUTPUT_CODEAI==="

const getSystemPrompt = () =>
  `You are a world-class software engineer well-versed in creating full-stack software, leveraging the nodejs ecosystem. Available to you are nodejs and npm, as well as the ability to create, read, update, delete files. Do not give any explanation, apologies, or any reasoning. Be concise and accurate. I will periodically interject with "${CONT_MESSAGE}" to prompt you to keep going. End each of your answer with "${END_INDICATOR}".`

// A crew implements the OODA loop
// Crew has access to the agent pool
// Crew can propose that a new agent should be hired
// Crew are spawn autonomously, will have a runtime, and will communicate back its result to the agentManager at each action
export const useCodeAI = () => {
  const log = useLog()

  const ai = useWindowAI(
    [
      {
        role: "system",
        content: getSystemPrompt()
      }
    ],
    {
      cacheSize: 10,
      keep: 1
    }
  )

  // Prompting the agent for output until it reaches the end indicator
  const callAI = async (input: string, onData?: (data: string) => void) => {
    const result = await ai.sendMessage(input, onData)

    if (!result) {
      return "Execution failed!"
    }

    let output = result.message.content

    while (!output.endsWith(END_INDICATOR)) {
      const continuedResult = await ai.sendMessage(CONT_MESSAGE, onData)
      if (!continuedResult) {
        output += END_INDICATOR
      } else {
        output += continuedResult.message.content
      }
    }

    return output.replace(END_INDICATOR, "")
  }

  const execute = async (
    {
      input,
      container
    }: {
      input: string
      container: WebContainer
    },
    onData?: (data: string) => void
  ) => {
    if (input === "clear") {
      ai.clear()
      return
    }

    await callAI(input, onData)

    return

    const result = await callAI(
      `Create a list of bash command to initialize the directory structure of a project with the goal of: \"${input}\". Each command should be separated by a new line.`,
      onData
    )

    const bashLines = result.split("\n").filter((cmd) => !cmd.startsWith("#"))

    let cwd = ""

    for (const line of bashLines) {
      const [cmd, prompt] = parseCmd(line)

      switch (cmd) {
        case "cd": {
          cwd = prompt
          break
        }
        case "mkdir": {
          await container.fs.mkdir(prompt)
          break
        }
        case "touch": {
          const fileContent = await callAI(
            `Provide the content for file "${prompt}"`
          )
          await container.fs.writeFile(prompt, fileContent)
          break
        }
        default: {
          onData?.(`Invalid command: ${cmd}`)
          break
        }
      }
    }

    // Define a set of command for file system operation

    // Define a set of command for npm/script spawning operation
  }

  return {
    execute
  }
}
