import { createProvider } from "puro"
import { useContext, useEffect, useRef } from "react"
import { type Terminal } from "xterm"

import { WebContainer, type WebContainerProcess } from "@webcontainer/api"
import type { FitAddon } from "xterm-addon-fit"
import { expressFiles } from "~features/web-vm/sample-files"

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

const useWebVMProvider = ({ manualBoot = false }) => {
  const terminalRef = useRef<Terminal>()
  const fitAddonRef = useRef<FitAddon>()
  const containerRef = useRef<WebContainer>()
  const shellProcRef = useRef<WebContainerProcess>()
  const bootingRef = useRef(false)
  const inputRef = useRef<WritableStreamDefaultWriter<string>>()

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
      containerRef.current = await WebContainer.boot()
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
    await container.mount(expressFiles)
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
      input.write(data)
    })

    inputRef.current = input
    shellProcRef.current = shellProcess
  }

  const render = async (el: HTMLElement) => {
    if (terminalRef.current) {
      terminalRef.current.dispose()
      terminalRef.current = undefined
    }

    const { terminal } = await createTerminal(el)

    terminal.writeln("> Welcome to the Language Agent Box")

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
    getTerminal,
    warmup,
    render,
    run
  }
}

const { BaseContext, Provider } = createProvider(useWebVMProvider)

export const WebVMProvider = Provider
export const useWebVM = () => useContext(BaseContext)
