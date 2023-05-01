import { createProvider } from "puro"
import { useContext, useEffect, useRef, useState } from "react"
import { type Terminal } from "xterm"

import { WebContainer, type WebContainerProcess } from "@webcontainer/api"
import type { FitAddon } from "xterm-addon-fit"
import { expressFiles } from "~features/web-vm/sample-files"
import { useWindowAI } from "~core/components/hooks/useWindowAI"

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

const useWebVMProvider = ({
  manualBoot = false,
  welcomePrompt = `Welcome to AI Container. Use "ai [prompt]" to issue instructions.`
}) => {
  const terminalRef = useRef<Terminal>()
  const fitAddonRef = useRef<FitAddon>()
  const containerRef = useRef<WebContainer>()
  const shellProcRef = useRef<WebContainerProcess>()
  const bootingRef = useRef(false)
  const inputRef = useRef<WritableStreamDefaultWriter<string>>()

  const promptRef = useRef("")

  const ai = useWindowAI(
    [
      {
        role: "system",
        content: `You are a software engineering expert specialized in working with minimal virtual machine containers running a limited subset of Unix commands. Adapt your knowledge and problem-solving skills to provide efficient solutions and guidance for software development tasks within this constrained environment.`
      }
    ],
    {
      stream: true,
      cacheSize: 24,
      keep: 1
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

  // Use this function to warmup the terminal and container before render, useful for loading or transitions
  const warmup = async () => {
    if (!containerRef.current && !bootingRef.current) {
      bootingRef.current = true
      const container = await WebContainer.boot({
        workdirName: "ai-container"
      })
      await container.mount(expressFiles)
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
      }
    })

    shellProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          terminal.write(data)
        }
      })
    )

    const input = shellProcess.input.getWriter()
    terminal.onData((data) => {
      switch (data) {
        // Enter
        case "\r": {
          // clear input
          if (execute(promptRef.current)) {
            input.write("\u0003")
          } else {
            input.write(`\r`)
          }

          promptRef.current = ""
          break
        }
        // Backspace (DEL)
        case "\u007F": {
          if (promptRef.current.length > 0) {
            promptRef.current = promptRef.current.slice(0, -1)
          }
          input.write(data)
          break
        }
        default: {
          if (
            (data >= String.fromCharCode(0x20) &&
              data <= String.fromCharCode(0x7e)) ||
            data >= "\u00a0"
          ) {
            promptRef.current += data
          }
          input.write(data)
        }
      }
    })

    inputRef.current = input
    shellProcRef.current = shellProcess
  }

  const _run = async (prompt: string) => {
    const terminal = getTerminal()
    const container = getContainer()
    terminal.writeln("")

    console.log(prompt)

    await ai.sendMessage(prompt, (data) => {
      terminal.write(data)
    })

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

  const execute = (_prompt: string) => {
    const [cmd, prompt] = _prompt.trim().split(/ (.*)/)

    // Replace with a map -> fn/description later
    if (cmd !== "ai") {
      return false
    }

    // run execute logic
    _run(prompt)
    return true
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
    if (!shellProcRef.current || !inputRef.current) {
      throw new Error("Shell process is not initialized")
    }

    const input = inputRef.current
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
