import type { Readable } from "stream"

export function log(...args: unknown[]) {
  if (process.env.NODE_ENV === "development") {
    console.log(...args)
  }
}

export function parseDataChunks(rawData: string): string[] {
  const lines = rawData.split("\n").filter((l) => l.startsWith("data: "))
  return lines.map((line) => line.split("data: ")[1]?.trim())
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
