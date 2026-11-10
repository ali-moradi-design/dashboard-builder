/** Distance from the top/bottom of the window where scrolling starts. */
const EDGE = 72
/** Fastest scroll, in pixels per frame, when the pointer is at the very edge. */
const MAX_SPEED = 22
/** The sticky app header covers the top of the window. */
const HEADER = 60

// One drag at a time, so one shared state is enough.
let frame = 0
let active = false
let x = 0
let y = 0

function step() {
  if (!active) return
  const bottom = window.innerHeight - EDGE
  const top = HEADER + EDGE
  const pull = y > bottom ? (y - bottom) / EDGE : y < top ? (y - top) / EDGE : 0
  if (pull !== 0) {
    const before = window.scrollY
    window.scrollBy(0, Math.round(Math.max(-1, Math.min(1, pull)) * MAX_SPEED))
    if (window.scrollY !== before) {
      // The grid library positions the dragged widget on mouse moves only:
      // re-send the last pointer position so the widget stays under the pointer.
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true }))
    }
  }
  frame = requestAnimationFrame(step)
}

/** Remembers where the pointer is. Ignores the moves `step` sends itself. */
function track(e: Event | undefined) {
  if (!(e instanceof MouseEvent) || !e.isTrusted) return
  x = e.clientX
  y = e.clientY
}

/**
 * Scrolls the page while a widget is dragged near the top or bottom of the
 * window, so a widget can be moved further than one screen in a single drag.
 */
export const edgeAutoScroll = {
  track,
  start(e: Event | undefined) {
    if (!(e instanceof MouseEvent)) return
    x = e.clientX
    y = e.clientY
    if (active) return
    active = true
    frame = requestAnimationFrame(step)
  },
  stop() {
    active = false
    cancelAnimationFrame(frame)
  },
}
