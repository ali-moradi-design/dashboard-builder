import type { Digits, Lang } from '../model'

export interface FormatContext {
  lang: Lang
  digits: Digits
}

/** BCP 47 locale for Intl: Gregorian calendar always, Latin digits on request. */
export function intlLocale({ lang, digits }: FormatContext): string {
  if (lang === 'fa') return digits === 'latin' ? 'fa-IR-u-ca-gregory-nu-latn' : 'fa-IR-u-ca-gregory'
  return 'en-US'
}

export type NumberStyle = 'number' | 'compact' | 'percent' | 'currency'

export interface NumberFormatOptions {
  style?: NumberStyle
  currency?: string
  decimals?: number
}

/**
 * Compact numbers keep the K/M suffix in both languages (decided with the user);
 * only the digits follow the locale.
 */
export function formatNumber(
  value: number,
  ctx: FormatContext,
  opts: NumberFormatOptions = {},
): string {
  const locale = intlLocale(ctx)
  const style = opts.style ?? 'number'
  const decimals = opts.decimals
  if (!Number.isFinite(value)) return '–'
  if (style === 'percent') {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      maximumFractionDigits: decimals ?? 1,
    }).format(value)
  }
  const compact =
    style === 'compact' ||
    (style === 'currency' && Math.abs(value) >= 1e4 && decimals === undefined)
  const base = new Intl.NumberFormat(locale, {
    maximumFractionDigits: decimals ?? (compact ? 1 : 2),
  })
  let text: string
  if (compact) {
    const abs = Math.abs(value)
    text =
      abs >= 1e9
        ? base.format(value / 1e9) + 'B'
        : abs >= 1e6
          ? base.format(value / 1e6) + 'M'
          : abs >= 1e3
            ? base.format(value / 1e3) + 'K'
            : base.format(value)
  } else {
    text = base.format(value)
  }
  if (style === 'currency') return currencySymbol(opts.currency ?? 'EUR') + text
  return text
}

function currencySymbol(code: string): string {
  const part = new Intl.NumberFormat('en-US', { style: 'currency', currency: code })
    .formatToParts(0)
    .find((p) => p.type === 'currency')
  return part?.value ?? code + ' '
}

export type DateGrain = 'day' | 'week' | 'month' | 'year'

export function formatDate(value: Date, ctx: FormatContext, grain: DateGrain = 'day'): string {
  const locale = intlLocale(ctx)
  const opts: Intl.DateTimeFormatOptions =
    grain === 'year'
      ? { year: 'numeric', timeZone: 'UTC' }
      : grain === 'month'
        ? { year: 'numeric', month: 'short', timeZone: 'UTC' }
        : { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }
  return new Intl.DateTimeFormat(locale, opts).format(value)
}
