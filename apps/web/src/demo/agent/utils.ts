export function extractCodeBlocks(markdown: string): string[] {
  // The regular expression to match code blocks, skipping the first line
  const codeBlockRegex = /```.*\n([\s\S]*?)```/g

  // Extract code blocks from the markdown string
  const codeBlocks = []
  let match
  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    codeBlocks.push(match[1]!)
  }

  return codeBlocks
}
