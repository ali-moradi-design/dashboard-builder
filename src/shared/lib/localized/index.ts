import type { Lang } from '../../model'

/** Text in both languages; Persian falls back to English. */
export interface LocalizedText {
  en: string
  fa?: string | undefined
}

export function localize(text: LocalizedText | string, lang: Lang): string {
  if (typeof text === 'string') return text
  return (lang === 'fa' ? text.fa : undefined) ?? text.en
}
