import type { Terminal } from "xterm"

/**
 *
 * @param input a cli command full line
 * @returns an array of cmd and args
 */
export const parseCmd = (input: string) => input.trim().split(/ (.*)/)

export function getInputBufferFromCursor(terminal: Terminal): string {
  const buffer = terminal.buffer.active
  let inputBuffer = ""
  let i = buffer.cursorY
  let line = buffer.getLine(i)

  while (line) {
    inputBuffer = line.translateToString(true) + inputBuffer
    if (line.isWrapped) {
      i--
    } else {
      break
    }
    line = buffer.getLine(i)
  }

  return inputBuffer
}
