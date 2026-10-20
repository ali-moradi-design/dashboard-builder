/**
 * A tiny, safe Markdown subset for the text widget: paragraphs, `#`/`##`
 * headings, `-` lists, **bold**, *italic*, `code` and [links](https://…).
 * It returns a tree, never HTML, so user text cannot inject markup.
 */
export type Inline =
  | { kind: 'text'; text: string }
  | { kind: 'strong'; children: Inline[] }
  | { kind: 'em'; children: Inline[] }
  | { kind: 'code'; text: string }
  | { kind: 'link'; href: string; children: Inline[] }

export type Block =
  | { kind: 'p'; children: Inline[] }
  | { kind: 'h'; level: 1 | 2; children: Inline[] }
  | { kind: 'ul'; items: Inline[][] }

const SAFE_URL = /^(https?:\/\/|mailto:)/i

export function parseInline(src: string): Inline[] {
  const out: Inline[] = []
  let i = 0
  let text = ''
  const flush = () => {
    if (text) out.push({ kind: 'text', text })
    text = ''
  }
  while (i < src.length) {
    const rest = src.slice(i)
    let m: RegExpMatchArray | null
    if ((m = /^\*\*(.+?)\*\*/.exec(rest))) {
      flush()
      out.push({ kind: 'strong', children: parseInline(m[1] ?? '') })
      i += m[0].length
    } else if ((m = /^\*(.+?)\*/.exec(rest))) {
      flush()
      out.push({ kind: 'em', children: parseInline(m[1] ?? '') })
      i += m[0].length
    } else if ((m = /^`([^`]+)`/.exec(rest))) {
      flush()
      out.push({ kind: 'code', text: m[1] ?? '' })
      i += m[0].length
    } else if ((m = /^\[([^\]]+)\]\(([^)\s]+)\)/.exec(rest))) {
      flush()
      const href = m[2] ?? ''
      const children = parseInline(m[1] ?? '')
      if (SAFE_URL.test(href)) out.push({ kind: 'link', href, children })
      else out.push(...children)
      i += m[0].length
    } else {
      text += src.charAt(i)
      i++
    }
  }
  flush()
  return out
}

export function parseMarkdown(src: string): Block[] {
  const blocks: Block[] = []
  const lines = src.replace(/\r\n?/g, '\n').split('\n')
  let para: string[] = []
  let list: string[] = []
  const flushPara = () => {
    if (para.length) blocks.push({ kind: 'p', children: parseInline(para.join(' ')) })
    para = []
  }
  const flushList = () => {
    if (list.length) blocks.push({ kind: 'ul', items: list.map(parseInline) })
    list = []
  }
  for (const raw of lines) {
    const line = raw.trim()
    let m: RegExpMatchArray | null
    if (!line) {
      flushPara()
      flushList()
    } else if ((m = /^(#{1,2})\s+(.*)$/.exec(line))) {
      flushPara()
      flushList()
      blocks.push({
        kind: 'h',
        level: (m[1]?.length ?? 1) as 1 | 2,
        children: parseInline(m[2] ?? ''),
      })
    } else if ((m = /^[-*]\s+(.*)$/.exec(line))) {
      flushPara()
      list.push(m[1] ?? '')
    } else {
      flushList()
      para.push(line)
    }
  }
  flushPara()
  flushList()
  return blocks
}
