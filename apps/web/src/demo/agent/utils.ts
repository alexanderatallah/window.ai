export function extractCodeBlocks(markdown: string): string[] {
  // The regular expression to match code blocks with a capturing group
  const codeBlockRegex = /```([\s\S]*?)```/g

  // Extract code blocks from the markdown string
  const codeBlocks = []
  let match
  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    codeBlocks.push(match[1]!)
  }

  return codeBlocks
}
