'use client'

import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'

import { isSafeCommentUrl } from '@/lib/comment-markdown'

function safeUrlTransform(url) {
  return isSafeCommentUrl(url) ? url : ''
}

export default function CommentMarkdown({ content, compact = false }) {
  const bodyClass = compact ? 'text-[0.84rem] leading-5' : 'text-sm leading-6'

  return (
    <ReactMarkdown
      skipHtml
      urlTransform={safeUrlTransform}
      remarkPlugins={[remarkGfm, remarkBreaks]}
      allowedElements={[
        'a',
        'blockquote',
        'br',
        'code',
        'em',
        'li',
        'ol',
        'p',
        'strong',
        'ul',
      ]}
      components={{
        p({ children }) {
          return (
            <p className={`break-words text-slate-100/92 ${bodyClass}`}>{children}</p>
          )
        },
        a({ href, children }) {
          if (!href) {
            return <>{children}</>
          }

          return (
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener ugc"
              className="font-medium text-[var(--accent-gold)] underline decoration-white/15 underline-offset-2 transition hover:text-white"
            >
              {children}
            </a>
          )
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-2 border-[var(--accent-ember)]/60 pl-3 text-slate-200/84">
              {children}
            </blockquote>
          )
        },
        code({ children }) {
          return (
            <code className="rounded bg-[rgba(255,255,255,0.08)] px-1.5 py-0.5 font-mono text-[0.92em] text-[var(--accent-gold)]">
              {children}
            </code>
          )
        },
        ol({ children }) {
          return <ol className="list-decimal space-y-1 pl-5">{children}</ol>
        },
        ul({ children }) {
          return <ul className="list-disc space-y-1 pl-5">{children}</ul>
        },
        li({ children }) {
          return <li className={`break-words text-slate-100/92 ${bodyClass}`}>{children}</li>
        },
        strong({ children }) {
          return <strong className="font-semibold text-white">{children}</strong>
        },
        em({ children }) {
          return <em className="italic text-slate-50">{children}</em>
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
