// use client
import { IconCheck, IconClipboard } from "@tabler/icons-react"
import clsx from "clsx"
import { useMemo, useState, type FC } from "react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import {
  oneDark,
  oneLight
} from "react-syntax-highlighter/dist/cjs/styles/prism"
import { useMatchMedia } from "~core/components/hooks/useMatchMedia"

export const programmingLanguages = {
  javascript: ".js",
  python: ".py",
  java: ".java",
  c: ".c",
  cpp: ".cpp",
  "c++": ".cpp",
  "c#": ".cs",
  ruby: ".rb",
  php: ".php",
  swift: ".swift",
  "objective-c": ".m",
  kotlin: ".kt",
  typescript: ".ts",
  go: ".go",
  perl: ".pl",
  rust: ".rs",
  scala: ".scala",
  haskell: ".hs",
  lua: ".lua",
  shell: ".sh",
  sql: ".sql",
  html: ".html",
  css: ".css"
  // add more file extensions here, make sure the key is same as language prop in CodeBlock.tsx component
} as const

type ProgrammingLanguage = keyof typeof programmingLanguages

export const generateRandomString = (length: number, lowercase = false) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXY3456789" // excluding similar looking characters like Z, 2, I, 1, O, 0
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return lowercase ? result.toLowerCase() : result
}

interface Props {
  language: ProgrammingLanguage
  value: string
}

// pulled from https://github.com/mckaywrigley/chatbot-ui/blob/main/utils/app/codeblock.ts
export const CodeBlock: FC<Props> = ({ language, value }) => {
  const [isCopied, setIsCopied] = useState<Boolean>(false)

  const copyToClipboard = () => {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      return
    }

    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true)

      setTimeout(() => {
        setIsCopied(false)
      }, 2000)
    })
  }
  const isDarkTheme = useMatchMedia("(prefers-color-scheme: dark)")
  const editorTheme = useMemo(
    () => (isDarkTheme ? oneDark : oneLight),
    [isDarkTheme]
  )

  if (isDarkTheme === undefined) {
    return null
  }

  return (
    <div className={clsx("codeblock relative font-sans text-[16px] group")}>
      <div className="flex items-center justify-between py-1.5 px-4">
        <span className="text-xs lowercase">{language}</span>

        <div className="flex items-center">
          <button
            className="flex gap-1.5 items-center rounded bg-none p-1 text-xs text-slate-11 group-hover:text-slate-12"
            onClick={copyToClipboard}>
            {isCopied ? <IconCheck size={18} /> : <IconClipboard size={18} />}
            {isCopied ? "Copied!" : "Copy code"}
          </button>
        </div>
      </div>
      <SyntaxHighlighter
        language={language}
        style={editorTheme}
        customStyle={{ margin: 0 }}>
        {value}
      </SyntaxHighlighter>
    </div>
  )
}
