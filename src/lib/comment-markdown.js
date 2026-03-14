import { unified } from 'unified'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { EXIT, visit } from 'unist-util-visit'

export const COMMENT_MAX_LENGTH = 2000
const ALLOWED_NODE_TYPES = new Set([
  'root',
  'paragraph',
  'text',
  'strong',
  'emphasis',
  'link',
  'list',
  'listItem',
  'blockquote',
  'inlineCode',
  'break',
])

const DISALLOWED_NODE_ERRORS = {
  code: 'Code blocks are not allowed in comments.',
  definition: 'Reference-style links are not allowed in comments.',
  delete: 'Strikethrough is not allowed in comments.',
  footnoteDefinition: 'Footnotes are not allowed in comments.',
  footnoteReference: 'Footnotes are not allowed in comments.',
  heading: 'Headings are not allowed in comments.',
  html: 'Raw HTML is not allowed in comments.',
  image: 'Images are not allowed in comments.',
  imageReference: 'Images are not allowed in comments.',
  linkReference: 'Reference-style links are not allowed in comments.',
  table: 'Tables are not allowed in comments.',
  tableCell: 'Tables are not allowed in comments.',
  tableRow: 'Tables are not allowed in comments.',
  thematicBreak: 'Horizontal rules are not allowed in comments.',
}

const markdownProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkBreaks)

function normalizeCommentText(content) {
  return String(content || '').replace(/\r\n?/g, '\n').trim()
}

function containsDisallowedControlCharacter(content) {
  return Array.from(content).some((character) => {
    const charCode = character.charCodeAt(0)

    if (charCode === 9 || charCode === 10 || charCode === 13) {
      return false
    }

    return charCode < 32 || charCode === 127
  })
}

export function isSafeCommentUrl(url) {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
  } catch {
    return false
  }
}

export function parseCommentMarkdown(content) {
  return markdownProcessor.runSync(markdownProcessor.parse(content))
}

export function validateCommentMarkdown(content) {
  const normalizedContent = normalizeCommentText(content)

  if (!normalizedContent) {
    return { error: 'Comment text is required.' }
  }

  if (normalizedContent.length > COMMENT_MAX_LENGTH) {
    return { error: `Comment must be ${COMMENT_MAX_LENGTH} characters or fewer.` }
  }

  if (containsDisallowedControlCharacter(normalizedContent)) {
    return { error: 'Comment contains unsupported control characters.' }
  }

  const ast = parseCommentMarkdown(normalizedContent)
  let validationError = null

  visit(ast, (node) => {
    if (validationError) {
      return EXIT
    }

    if (node.type === 'link') {
      if (!isSafeCommentUrl(node.url)) {
        validationError = 'Only http and https links are allowed in comments.'
        return EXIT
      }
    }

    if (node.type === 'listItem' && node.checked !== null && node.checked !== undefined) {
      validationError = 'Task lists are not allowed in comments.'
      return EXIT
    }

    if (!ALLOWED_NODE_TYPES.has(node.type)) {
      validationError =
        DISALLOWED_NODE_ERRORS[node.type] ||
        'This markdown feature is not allowed in comments.'
      return EXIT
    }
  })

  if (validationError) {
    return { error: validationError }
  }

  return {
    data: {
      content: normalizedContent,
      ast,
    },
  }
}
