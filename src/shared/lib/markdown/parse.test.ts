import { describe, expect, it } from 'vitest'

import { parseInline, parseMarkdown } from './parse'

describe('parseMarkdown', () => {
  it('parses paragraphs, headings and lists', () => {
    const blocks = parseMarkdown('# Title\n\nFirst line\nsame paragraph\n\n- one\n- two')
    expect(blocks.map((b) => b.kind)).toEqual(['h', 'p', 'ul'])
    expect(blocks[1]).toEqual({
      kind: 'p',
      children: [{ kind: 'text', text: 'First line same paragraph' }],
    })
    expect(blocks[2]?.kind === 'ul' && blocks[2].items).toHaveLength(2)
  })

  it('parses inline formatting', () => {
    expect(parseInline('a **b** *c* `d`')).toEqual([
      { kind: 'text', text: 'a ' },
      { kind: 'strong', children: [{ kind: 'text', text: 'b' }] },
      { kind: 'text', text: ' ' },
      { kind: 'em', children: [{ kind: 'text', text: 'c' }] },
      { kind: 'text', text: ' ' },
      { kind: 'code', text: 'd' },
    ])
  })

  it('keeps only safe links', () => {
    expect(parseInline('[ok](https://example.com)')[0]).toMatchObject({
      kind: 'link',
      href: 'https://example.com',
    })
    expect(parseInline('[bad](javascript:alert(1))')).toEqual([
      { kind: 'text', text: 'bad' },
      { kind: 'text', text: ')' },
    ])
  })

  it('treats HTML as plain text', () => {
    expect(parseMarkdown('<img src=x onerror=alert(1)>')).toEqual([
      { kind: 'p', children: [{ kind: 'text', text: '<img src=x onerror=alert(1)>' }] },
    ])
  })
})
