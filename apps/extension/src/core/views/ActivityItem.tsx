import { isMediaHosted, isMediaOutput, isPromptInput } from "window.ai"

import { Logo } from "~core/components/pure/Logo"
import { Text } from "~core/components/pure/Text"
import { originManager } from "~core/managers/origin"
import type { Transaction } from "~core/managers/transaction"
import { transactionManager } from "~core/managers/transaction"
import { extractExtensionFromURL, formatDate } from "~core/utils/utils"

function createMediaDownloadLinks({ input, outputs }: Transaction) {
  if (
    !outputs ||
    !outputs.every(isMediaOutput) ||
    !isPromptInput(input) ||
    !outputs.every(isMediaHosted)
  ) {
    return null
  }
  return outputs.map((output, index) => {
    // typescript seems to need this check here, although the isMediaHosted check above should make it redundant
    if (!output.url) {
      return null
    }
    // defaults to no extension
    const extension: string | undefined = extractExtensionFromURL(output.url)
    const fileName = `${input.prompt.replace(" ", "-")}-${index}${
      extension ? "." : ""
    }${extension}`
    return (
      <a
        href={output.url}
        target="_blank"
        rel="noreferrer"
        download={fileName}
        className="text-blue-500 hover:underline block"
        key={index}>
        Download {fileName}
      </a>
    )
  })
}

export function ActivityItem({ transaction }: { transaction: Transaction }) {
  const url = originManager.url(transaction.origin)
  const model = transactionManager.getRoutedModel(transaction)
  const output =
    transaction?.outputs?.every(isMediaOutput) &&
    transaction?.outputs?.every(isMediaHosted)
      ? createMediaDownloadLinks(transaction)
      : transactionManager.formatOutput(transaction)
  let input = transactionManager.formatInput(transaction)
  return (
    <div className="pb-8">
      <div className="grid grid-cols-6 mb-2">
        <Logo
          className="w-7 self-top mr-3 mt-4"
          faviconFor={transaction.origin.domain}
        />
        <div className="col-span-5">
          <Text size="lg" strength="bold">
            {transaction.origin.title}
          </Text>
          <Text dimming="less" truncate>
            <a href={url} title={url} target="_blank" rel="noreferrer">
              {originManager.urlDisplay(transaction.origin)}
            </a>
          </Text>
          <div className="mt-2">
            <Text dimming="more" size="xs" truncate>
              {formatDate(transaction.timestamp)}
            </Text>
          </div>
        </div>
      </div>

      {/* <div className="mt-1 text-xs text-slate-600 leading-loose">
        {formatDate(transaction.timestamp)}
      </div> */}

      {model && (
        <p className="mt-4">
          <b>Model:</b> {model}
        </p>
      )}

      <p className="mt-4">
        <b>Prompt:</b> {input}
      </p>

      <p className="mt-4">
        <b>Response:</b>{" "}
        {output ||
          (!transaction.error && <span className="italic">Pending</span>)}
      </p>

      {transaction.error && (
        <div className="mt-4 text-red-300 ">
          <b>Error:</b> {transaction.error}
        </div>
      )}
    </div>
  )
}
