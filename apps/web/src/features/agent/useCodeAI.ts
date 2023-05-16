import type { WebContainer } from "@webcontainer/api"
import { posix } from "path"
import { useWindowAI } from "~core/hooks/useWindowAI"
import { parseCmd } from "~features/web-vm/terminal-parser"
import { extractCodeBlocks } from "~features/agent/utils"

const CONT_MESSAGE = "===CONTINUE_CODEAI==="

const END_INDICATOR = "===END_OUTPUT_CODEAI==="

//  Available to you are nodejs and npm, as well as the ability to create, read, update, delete files. Do not give any explanation, apologies, or any reasoning. Be concise and accurate.

const getSystemPrompt = () =>
  `You are a world-class software engineer well-versed in creating full-stack software, leveraging the nodejs ecosystem. Available to you are nodejs, npm and a very minimal UNIX shell. Do not give any explanation, apologies, or any reasoning. Be concise and accurate. I will periodically interject with "${CONT_MESSAGE}" to prompt you to keep going. End each of your answer with "${END_INDICATOR}".`

// A crew implements the OODA loop
// Crew has access to the agent pool
// Crew can propose that a new agent should be hired
// Crew are spawn autonomously, will have a runtime, and will communicate back its result to the agentManager at each action
export const useCodeAI = () => {
  const ai = useWindowAI(
    [
      {
        role: "system",
        content: getSystemPrompt()
      }
    ],
    {
      cacheSize: 20,
      prefixMessageCount: 1,
      temperature: 0
    }
  )

  // Prompting the agent for output until it reaches the end indicator
  const callAI = async (
    input: string,
    onData?: (data: string) => void,
    loopLimit = 4
  ) => {
    const result = await ai.sendMessage(input, onData)

    if (!result) {
      return "Execution failed!"
    }

    let output = result.message.content
    let loopCount = 0

    while (!output.endsWith(END_INDICATOR) && loopCount < loopLimit) {
      const continuedResult = await ai.sendMessage(CONT_MESSAGE, onData)
      if (!continuedResult) {
        output += END_INDICATOR
      } else {
        output += continuedResult.message.content
      }
      loopCount++
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

    // await callAI(input, onData)

    // return

    const scaffoldProjectResult = await callAI(
      `Create a list of bash command to initialize the directory structure of a project with the goal of: \"${input}\". Each command should be separated by a new line. Wrap them inside a markdown code block. Do not use npm to initialize the project - create the package.json manually. The current directory should be the project root. You may use cd, mkdir, and touch only.`,
      onData
    )

    onData?.("\n")

    await runBash(
      getBashLines(scaffoldProjectResult),
      container,
      callAI,
      onData
    )
    // Define a set of command for file system operation
    // Define a set of command for npm/script spawning operation

    const runProjectResult = await callAI(
      `Create a list of bash command to start the project created. Each command should be separated by a new line. Wrap them inside a markdown code block. You may only use npm.`,
      onData
    )

    onData?.("\n")

    await runBash(getBashLines(runProjectResult), container, callAI, onData)

    onData?.("Press CTRL + C or CMD + C to exit.")
  }

  return {
    execute
  }
}

function getBashLines(scaffoldProjectResult: string) {
  return extractCodeBlocks(scaffoldProjectResult)
    .join("\n")
    .split("\n")
    .filter((cmd) => !cmd.startsWith("#"))
}

async function runBash(
  bashLines: string[],
  container: WebContainer,
  callAI: (
    input: string,
    onData?: (data: string) => void,
    loopLimit?: number
  ) => Promise<string>,
  onData?: (data: string) => void
) {
  let cwd = ""

  for (const line of bashLines) {
    const [cmd, prompt] = parseCmd(line)

    try {
      switch (cmd) {
        case "cd": {
          cwd = posix.join(cwd, prompt)
          break
        }
        case "mkdir": {
          await container.fs.mkdir(posix.join(cwd, prompt))
          break
        }
        case "touch": {
          const contentResp = await callAI(
            `The content for the file "${prompt}" is:`,
            onData
          )

          onData?.("\n")

          const fileContent = extractCodeBlocks(contentResp).join("\n")

          await container.fs.writeFile(posix.join(cwd, prompt), fileContent)
          break
        }
        case "npm": {
          const proc = await container.spawn("npm", prompt.split(" "))
          proc.output.pipeTo(
            new WritableStream({
              write(data) {
                onData?.(data)
              }
            })
          )

          await proc.exit
        }

        default: {
          break
        }
      }
    } catch {}
  }
}
