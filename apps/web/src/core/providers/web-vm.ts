import { createProvider } from "puro"
import { useContext, useEffect, useRef, useState } from "react"
import { type Terminal } from "xterm"

import { WebContainer, type WebContainerProcess } from "@webcontainer/api"
import type { FitAddon } from "xterm-addon-fit"
import { useWindowAI } from "~core/components/hooks/useWindowAI"
import { getInputBufferFromCursor, parseCmd } from "~core/utils/terminal-parser"
import { useCodeAI } from "~features/agent/useCodeAI"
import { binDirectory } from "~features/web-vm/files"
import { posix } from "path"

async function createTerminal(el: HTMLElement) {
  const [{ Terminal }, { WebglAddon }, { FitAddon }] = await Promise.all([
    import("xterm"),
    import("xterm-addon-webgl"),
    import("xterm-addon-fit")
  ])

  const terminal = new Terminal({
    convertEol: true,
    cursorBlink: true,
    allowProposedApi: true
  })

  const fitAddon = new FitAddon()
  terminal.loadAddon(new WebglAddon())
  terminal.loadAddon(fitAddon)
  terminal.open(el)
  fitAddon.fit()

  return {
    terminal,
    fitAddon
  }
}

const WORKING_BIN_PATH = ".bin"
const JSH_HISTORY_PATH = "/home/.jsh_history"

// Use this bin cache for temp memory cache
// TODO: can probably read the file itself OR make this into a map to store the AI-generated script itself
const binCache = new Set<string>()

const addBin = async (cmd: string, container: WebContainer) => {
  // Use this to read past cmd history if needed:
  // const proc = await container.spawn("cat", [JSH_HISTORY_PATH])
  // const { value: historyEntries } = await proc.output.getReader().read()

  if (binCache.has(cmd)) {
    return
  }

  binCache.add(cmd)
  // Just make empty file for now
  const cmdBinPath = posix.join(WORKING_BIN_PATH, cmd)
  await container.fs.writeFile(cmdBinPath, "")
  const chmodProc = await container.spawn("chmod", ["+x", cmdBinPath], {
    output: false
  })

  await chmodProc.exit
}

// TODO: Make this a cool map or something
const customCommandList = ["ai", "code"] as const
type CustomCommand = (typeof customCommandList)[number]

const customCommandSet = new Set(customCommandList)
const isCustomCommand = (cmd: any): cmd is CustomCommand =>
  customCommandSet.has(cmd)

// You will think step-by-step for each of my command, and output each step in a JSON object.

const useWebVMProvider = ({
  manualBoot = false,
  workdirName = "ai-container",
  welcomePrompt = `Welcome to AI Container: 
  - Use "ai [prompt]" to issue any instructions
  - Use "code [prompt]" to automate software engineering
  - Non-standard unix commands will be simulated
  `
}) => {
  const terminalRef = useRef<Terminal>()
  const fitAddonRef = useRef<FitAddon>()
  const containerRef = useRef<WebContainer>()
  const shellProcRef = useRef<WebContainerProcess>()
  const bootingRef = useRef(false)
  const inputRef = useRef<WritableStreamDefaultWriter<string>>()

  const codeAI = useCodeAI()

  const shellAI = useWindowAI(
    [
      {
        role: "system",
        content: `You are a powerful Linux quantum virtual machine that can simulate new command-line program, non-standard UNIX program, and anything above and beyond. If a program can be answered with just text, write just text. If a program is creating graphic, you will use ASCII art. If a program is creating audio, you will write music notations or lyrics. Be super creative and resourceful with how you come up with the output. You are not just any text-based program. Do not give any explanation, apologies, or any reasoning. Just output the result.`
      }
    ],
    {
      temperature: 0,
      cacheSize: 24,
      prefixMessageCount: 1
    }
  )

  const [activeUrl, setActiveUrl] = useState("")

  const getContainer = () => {
    if (!containerRef.current) {
      throw new Error("Container is not initialized")
    }
    return containerRef.current
  }

  const getTerminal = () => {
    if (!terminalRef.current) {
      throw new Error("Terminal is not initialized")
    }
    return terminalRef.current
  }

  const getInput = () => {
    if (!inputRef.current) {
      throw new Error("Input is not initialized")
    }
    return inputRef.current
  }

  // Use this function to warmup the terminal and container before render, useful for loading or transitions
  const warmup = async () => {
    if (!containerRef.current && !bootingRef.current) {
      bootingRef.current = true
      const container = await WebContainer.boot({
        workdirName
      })
      /**
       * Use the .bin dir to store runable scripts
       * TODO: potentially generate working scripts on the fly
       * For now, it acts as a way to allow any command to be found in PATH, and thus get registered into jsh_history
       */
      await container.fs.mkdir(".bin")
      container.on("port", (_port, type, url) => {
        switch (type) {
          case "open":
            setActiveUrl(url)
            break
          case "close":
            setActiveUrl("")
            break
        }
      })

      containerRef.current = container
      bootingRef.current = false
      spawnShell()
    }
  }

  useEffect(() => {
    if (!manualBoot) {
      warmup()
    }
  }, [])

  useEffect(() => {
    function onResize() {
      fitAddonRef.current?.fit()
      if (terminalRef.current && shellProcRef.current) {
        const terminal = terminalRef.current
        const shellProcess = shellProcRef.current
        shellProcess.resize({
          cols: terminal.cols,
          rows: terminal.rows
        })
      }
    }

    globalThis.window.addEventListener("resize", onResize)

    return () => {
      globalThis.window.removeEventListener("resize", onResize)
    }
  }, [])

  const spawnShell = async () => {
    if (!containerRef.current || !terminalRef.current) {
      return
    }
    const container = getContainer()
    const terminal = getTerminal()

    const shellProcess = await container.spawn("jsh", {
      terminal: {
        rows: terminal.rows,
        cols: terminal.cols
      },
      env: {
        PATH: `${container.path}:/home/${workdirName}/.bin`
      }
    })

    shellProcess.output.pipeTo(
      new WritableStream({
        write(shellData) {
          // if data is a flush, rewrite the welcome prompt
          if (shellData === "\u001B[0J") {
            terminal.write(shellData)
            terminal.writeln(welcomePrompt)
          } else {
            terminal.write(shellData)
          }
        }
      })
    )

    const input = shellProcess.input.getWriter()
    let inputPrompt = ""
    let multiline = false

    terminal.onData(async (data) => {
      switch (data) {
        // Enter
        case "\r": {
          // Store the prompt into jsh_history somehow as the top item
          const tempLine = getInputBufferFromCursor(terminal)
          const indexOfCadet = tempLine.indexOf("❯ ")
          if (multiline) {
            inputPrompt += tempLine.substring(
              indexOfCadet + 2,
              tempLine.length - 1
            )

            input.write(data)
          } else {
            inputPrompt += tempLine?.substring(indexOfCadet + 2)

            // DEBUG: swap these lines
            await execute(inputPrompt)
            // input.write(data)
            inputPrompt = ""
          }

          multiline = false
          break
        }
        case "\\": {
          multiline = true
          input.write(data)
          break
        }
        default: {
          multiline = false
          input.write(data)
        }
      }
    })

    inputRef.current = input
    shellProcRef.current = shellProcess
  }

  const execute = async (_prompt: string) => {
    const [cmd, prompt] = parseCmd(_prompt)

    const input = getInput()
    const terminal = getTerminal()
    const container = getContainer()

    // Replace with a map -> fn/description later
    if (isCustomCommand(cmd)) {
      await addBin(cmd, container)
      terminal.write("\n\n")

      switch (cmd) {
        case "ai": {
          await shellAI.sendMessage(prompt, (d) => terminal.write(d))
          break
        }

        case "code": {
          await codeAI.execute(
            {
              input: prompt,
              container
            },
            (d) => terminal.write(d)
          )
          break
        }
      }

      input.write("\r")
      return
    }

    // OPTIONAL behavior:

    // use which to check if cmd exists, if so run it, otherwise, create that script!
    const whichProc = await container.spawn("which", [cmd], {
      output: false
    })

    const whichExit = await whichProc.exit

    if (whichExit === 0) {
      input.write(`\r`)
      return
    }

    await addBin(cmd, container)
    terminal.write("\n\n")
    await shellAI.sendMessage(
      `What is a creative output for the following command? 
  
 ${_prompt}
 
 Respond with JUST the output of the command:
 `,
      (data) => {
        terminal.write(data)
      }
    )

    input.write("\r")

    // Sample on how to sequentially run cmd:
    // const proc = await container.spawn("npm", ["i"])

    // proc.output.pipeTo(
    //   new WritableStream({
    //     write(data) {
    //       terminal.write(data)
    //     }
    //   })
    // )

    // await proc.exit

    // const proc2 = await container.spawn("npm", ["run", "start"])

    // proc2.output.pipeTo(
    //   new WritableStream({
    //     write(data) {
    //       terminal.write(data)
    //     }
    //   })
    // )

    // await proc2.exit
  }

  const render = async (el: HTMLElement) => {
    if (terminalRef.current) {
      if (terminalRef.current.element?.checkVisibility()) {
        return
      }
      terminalRef.current.dispose()
      terminalRef.current = undefined
    }

    const { terminal } = await createTerminal(el)

    terminal.writeln(welcomePrompt)
    terminalRef.current = terminal

    spawnShell()
  }

  const run = async (cmd: string) => {
    const input = getInput()
    await input.write(cmd + "\r")
  }

  return {
    activeUrl,
    getTerminal,
    getContainer,
    warmup,
    render,
    run
  }
}

const { BaseContext, Provider } = createProvider(useWebVMProvider)

export const WebVMProvider = Provider
export const useWebVM = () => useContext(BaseContext)
