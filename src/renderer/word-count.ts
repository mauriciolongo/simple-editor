/**
 * Count words in markdown content.
 * - Strips markdown syntax before counting
 * - Excludes code blocks and inline code
 * - Only counts sequences with at least one alphanumeric character
 */
export function countWords(markdown: string): number {
  let text = markdown

  // Remove fenced code blocks (```...```)
  text = text.replace(/```[\s\S]*?```/g, '')

  // Remove indented code blocks (4 spaces or tab at start of line)
  text = text.replace(/^(?:    |\t).+$/gm, '')

  // Remove inline code (`...`)
  text = text.replace(/`[^`]+`/g, '')

  // Remove images ![alt](url)
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '')

  // Remove links but keep text [text](url) -> text
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')

  // Remove reference-style links [text][ref]
  text = text.replace(/\[([^\]]*)\]\[[^\]]*\]/g, '$1')

  // Remove link definitions [ref]: url
  text = text.replace(/^\[[^\]]+\]:\s*\S+.*$/gm, '')

  // Remove bold/italic markers
  text = text.replace(/(\*\*\*|___)/g, '')
  text = text.replace(/(\*\*|__)/g, '')
  text = text.replace(/(\*|_)/g, '')

  // Remove strikethrough
  text = text.replace(/~~/g, '')

  // Remove headings markers
  text = text.replace(/^#{1,6}\s+/gm, '')

  // Remove blockquote markers
  text = text.replace(/^>\s*/gm, '')

  // Remove horizontal rules
  text = text.replace(/^[-*_]{3,}\s*$/gm, '')

  // Remove list markers (unordered and ordered)
  text = text.replace(/^[\s]*[-*+]\s+/gm, '')
  text = text.replace(/^[\s]*\d+\.\s+/gm, '')

  // Remove task list markers
  text = text.replace(/\[[ xX]\]\s*/g, '')

  // Split on whitespace and filter
  const words = text.split(/\s+/).filter((word) => {
    // Must have at least one alphanumeric character
    return /[a-zA-Z0-9]/.test(word)
  })

  return words.length
}

/**
 * Format word count for display
 */
export function formatWordCount(count: number): string {
  return `Words: ${count.toLocaleString()}`
}
