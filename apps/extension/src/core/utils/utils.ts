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

// Taken from supabase https://github.com/supabase/gotrue-js/blob/c7eb42fc048023baa733de75137c7ff303a6b8d4/src/lib/helpers.ts#LL179C1-L179C1
// which took it from https://stackoverflow.com/questions/38552003/how-to-decode-jwt-token-in-javascript-without-using-a-library
export function decodeJWTPayload(token: string) {
  // Regex checks for base64url format
  const base64UrlRegex =
    /^([a-z0-9_-]{4})*($|[a-z0-9_-]{3}=?$|[a-z0-9_-]{2}(==)?$)$/i

  const parts = token.split(".")

  if (parts.length !== 3) {
    throw new Error("JWT is not valid: not a JWT structure")
  }

  if (!base64UrlRegex.test(parts[1])) {
    throw new Error("JWT is not valid: payload is not in base64url format")
  }

  const base64Url = parts[1]
  return JSON.parse(decodeBase64URL(base64Url))
}

export function decodeBase64URL(value: string): string {
  const key =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
  let base64 = ""
  let chr1, chr2, chr3
  let enc1, enc2, enc3, enc4
  let i = 0
  value = value.replace("-", "+").replace("_", "/")

  while (i < value.length) {
    enc1 = key.indexOf(value.charAt(i++))
    enc2 = key.indexOf(value.charAt(i++))
    enc3 = key.indexOf(value.charAt(i++))
    enc4 = key.indexOf(value.charAt(i++))
    chr1 = (enc1 << 2) | (enc2 >> 4)
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2)
    chr3 = ((enc3 & 3) << 6) | enc4
    base64 = base64 + String.fromCharCode(chr1)

    if (enc3 != 64 && chr2 != 0) {
      base64 = base64 + String.fromCharCode(chr2)
    }
    if (enc4 != 64 && chr3 != 0) {
      base64 = base64 + String.fromCharCode(chr3)
    }
  }
  return base64
}
