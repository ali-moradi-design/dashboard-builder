import type { EChartsCoreOption, EChartsType } from 'echarts/core'
import { useEffect, useRef } from 'react'

import { echarts } from './setup'

export interface EChartProps {
  option: EChartsCoreOption
  /** Accessible description of the chart. */
  label: string
  className?: string
}

/** Thin React wrapper: one chart instance per element, resized with its box. */
export function EChart({ option, label, className }: EChartProps) {
  const el = useRef<HTMLDivElement>(null)
  const chart = useRef<EChartsType | null>(null)

  useEffect(() => {
    const node = el.current
    if (!node) return
    const instance = echarts.init(node, undefined, { renderer: 'canvas' })
    chart.current = instance
    // Resizing a widget fires many observations per frame: redraw once per frame,
    // and skip the first one (the chart was just created at this size).
    let frame = 0
    let width = node.clientWidth
    let height = node.clientHeight
    const observer = new ResizeObserver(() => {
      if (node.clientWidth === width && node.clientHeight === height) return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        width = node.clientWidth
        height = node.clientHeight
        instance.resize()
      })
    })
    observer.observe(node)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      instance.dispose()
      chart.current = null
    }
  }, [])

  useEffect(() => {
    chart.current?.setOption(option, { notMerge: true, lazyUpdate: true })
  }, [option])

  return <div ref={el} role="img" aria-label={label} className={className ?? 'h-full w-full'} />
}
