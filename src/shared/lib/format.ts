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

/*
 * Constructing an Intl formatter is far more expensive than using one, and
 * charts and tables format thousands of values per render. Formatters are
 * immutable, so one instance per (locale, options) is shared.
 */
const numberFormats = new Map<string, Intl.NumberFormat>()
function numberFormat(locale: string, percent: boolean, maxDigits: number): Intl.NumberFormat {
  const key = `${locale}|${percent ? 'p' : 'n'}|${maxDigits}`
  let f = numberFormats.get(key)
  if (!f) {
    f = new Intl.NumberFormat(locale, {
      ...(percent ? { style: 'percent' as const } : {}),
      maximumFractionDigits: maxDigits,
    })
    numberFormats.set(key, f)
  }
  return f
}

const dateFormats = new Map<string, Intl.DateTimeFormat>()
/** Shared `Intl.DateTimeFormat` for a locale and options (`id` names the options). */
export function dateTimeFormat(
  locale: string,
  id: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = `${locale}|${id}`
  let f = dateFormats.get(key)
  if (!f) {
    f = new Intl.DateTimeFormat(locale, options)
    dateFormats.set(key, f)
  }
  return f
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
    return numberFormat(locale, true, decimals ?? 1).format(value)
  }
  const compact =
    style === 'compact' ||
    (style === 'currency' && Math.abs(value) >= 1e4 && decimals === undefined)
  const base = numberFormat(locale, false, decimals ?? (compact ? 1 : 2))
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

const currencySymbols = new Map<string, string>()
function currencySymbol(code: string): string {
  let symbol = currencySymbols.get(code)
  if (symbol === undefined) {
    const part = new Intl.NumberFormat('en-US', { style: 'currency', currency: code })
      .formatToParts(0)
      .find((p) => p.type === 'currency')
    symbol = part?.value ?? code + ' '
    currencySymbols.set(code, symbol)
  }
  return symbol
}

export type DateGrain = 'day' | 'week' | 'month' | 'year'

export function formatDate(value: Date, ctx: FormatContext, grain: DateGrain = 'day'): string {
  const locale = intlLocale(ctx)
  const id = grain === 'year' || grain === 'month' ? grain : 'day'
  const opts: Intl.DateTimeFormatOptions =
    id === 'year'
      ? { year: 'numeric', timeZone: 'UTC' }
      : id === 'month'
        ? { year: 'numeric', month: 'short', timeZone: 'UTC' }
        : { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }
  return dateTimeFormat(locale, id, opts).format(value)
}
