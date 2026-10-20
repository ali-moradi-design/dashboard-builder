import { useSyncExternalStore } from 'react'

export interface ChartTheme {
  mode: 'light' | 'dark'
  series: string[]
  text: string
  muted: string
  grid: string
  surface: string
  border: string
  accent: string
  font: string
  rtl: boolean
}

function read(): ChartTheme {
  const root = document.documentElement
  const css = getComputedStyle(root)
  const v = (name: string) => css.getPropertyValue(name).trim()
  return {
    mode: root.dataset.theme === 'dark' ? 'dark' : 'light',
    series: [v('--s1'), v('--s2'), v('--s3'), v('--s4'), v('--s5')],
    text: v('--text'),
    muted: v('--muted'),
    grid: v('--grid-line'),
    surface: v('--surface'),
    border: v('--border'),
    accent: v('--accent'),
    font: v('--app-font') || 'sans-serif',
    rtl: root.dir === 'rtl',
  }
}

let cached: ChartTheme | undefined
let key = ''

function snapshot(): ChartTheme {
  const root = document.documentElement
  const k = `${root.dataset.theme ?? ''}|${root.dir}|${root.lang}`
  if (!cached || k !== key) {
    key = k
    cached = read()
  }
  return cached
}

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'dir', 'lang'],
  })
  return () => observer.disconnect()
}

/** Chart colors from the CSS tokens; updates when theme or direction changes. */
export function useChartTheme(): ChartTheme {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
