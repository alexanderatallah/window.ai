import { Readable } from "stream"
import type { ChatMessage } from "window.ai"

export function log(...args: unknown[]) {
  if (process.env.NODE_ENV === "development") {
    console.log(...args)
  }
}

export function parseDataChunks(rawData: string): string[] {
  const lines = rawData.split("\n").filter((l) => l.startsWith("data: "))
  return lines.map((line) => line.split("data: ")[1]?.trim())
}

type RemoveUndefinedKeys<T> = {
  [K in keyof T as T[K] extends undefined ? never : K]: T[K]
}

export function definedValues<T extends object>(
  obj: T
): RemoveUndefinedKeys<T> {
  return Object.entries(obj)
    .filter(([, value]) => value !== undefined)
    .reduce(
      (acc, [key, value]) => ({ ...acc, [key]: value }),
      {} as RemoveUndefinedKeys<T>
    )
}

export function messagesToPrompt(messages: ChatMessage[]): string {
  return (
    messages
      .map((m) => `${m.role === "user" ? "<human>" : "<bot>"}: ${m.content}`)
      .join("\n") + "\n<bot>: "
  )
}

export function formatDate(timestampMs: number): string {
  const date = new Date(timestampMs)
  return date.toLocaleString()
}

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`)
}

export function isReadable(
  stream: Readable | ReadableStream
): stream is Readable {
  return (stream as Readable).read !== undefined
}
