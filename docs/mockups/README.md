# Mockups

Static design mockups for approval before app code: dashboard view (all eleven
widget types), edit mode
with the widget settings panel, and the query builder, in dark and light,
English and Persian. Charts are hand-drawn SVG, not ECharts.

- `mockup.html?view=dashboard|edit|query&theme=dark|light&lang=en|fa`
- `node docs/mockups/render.cjs` renders all 12 PNGs into `png/` with Playwright.

Palette tokens (WCAG AA checked: text ≥ 4.5:1, chart marks ≥ 3:1 on surfaces):

| Token   | Dark      | Light     |
| ------- | --------- | --------- |
| bg      | `#2A2D2F` | `#FDFDFF` |
| surface | `#393D3F` | `#F4F4F1` |
| border  | `#50565A` | `#D6D5CB` |
| text    | `#FDFDFF` | `#393D3F` |
| muted   | `#C6C5B9` | `#546A7B` |
| accent  | `#7FB0BC` | `#3F6F7A` |
| series  | `#7FB0BC #C6C5B9 #8C9FB0 #D9E6E9 #5E98A6` | `#4A7F8B #8A887A #546A7B #2F5963 #6F8D9C` |
