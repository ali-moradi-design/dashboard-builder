import { Fragment } from 'react'

import { parseMarkdown, type Inline } from '../lib/markdown'

function InlineNodes({ nodes }: { nodes: Inline[] }) {
  return nodes.map((n, i) => {
    switch (n.kind) {
      case 'text':
        return <Fragment key={i}>{n.text}</Fragment>
      case 'strong':
        return (
          <strong key={i}>
            <InlineNodes nodes={n.children} />
          </strong>
        )
      case 'em':
        return (
          <em key={i}>
            <InlineNodes nodes={n.children} />
          </em>
        )
      case 'code':
        return (
          <code key={i} className="rounded bg-surface-2 px-1 text-[0.9em]">
            {n.text}
          </code>
        )
      case 'link':
        return (
          <a
            key={i}
            href={n.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline underline-offset-3"
          >
            <InlineNodes nodes={n.children} />
          </a>
        )
    }
  })
}

/** Renders the safe Markdown subset as React elements (no innerHTML). */
export function Markdown({ source }: { source: string }) {
  const blocks = parseMarkdown(source)
  return (
    <div className="flex flex-col gap-2 text-sm leading-relaxed">
      {blocks.map((b, i) =>
        b.kind === 'p' ? (
          <p key={i} dir="auto">
            <InlineNodes nodes={b.children} />
          </p>
        ) : b.kind === 'h' ? (
          b.level === 1 ? (
            <h4 key={i} dir="auto" className="text-base font-bold">
              <InlineNodes nodes={b.children} />
            </h4>
          ) : (
            <h5 key={i} dir="auto" className="font-semibold">
              <InlineNodes nodes={b.children} />
            </h5>
          )
        ) : (
          <ul key={i} className="list-disc ps-5">
            {b.items.map((item, j) => (
              <li key={j} dir="auto">
                <InlineNodes nodes={item} />
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  )
}
