# Dashboard builder

Build dashboards from data without code, like Metabase or Looker Studio, fully
in the browser. Pick a dataset, describe what you want with drag and drop
("sum of revenue by month, Germany only"), show it as a chart, table or KPI,
and arrange widgets on a grid.

- **No server.** Queries run in the browser with DuckDB-WASM in a Web Worker;
  your own CSV files never leave the browser.
- **11 widget types:** KPI card, line, area, bar, stacked bar, pie/donut,
  scatter, heatmap, table, heading and text.
- **Query builder without SQL:** measures (sum, avg, count, min, max), up to
  two group-bys (dates by day, week, month or year), filters, sort and limit.
  Queries are stored as JSON and compiled to parameterized SQL.
- **Editor:** drag widgets from a palette, move and resize them, undo/redo
  every edit (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z), autosave.
- **Dashboards** are saved in IndexedDB and shared as JSON files
  (export/import). One global date-range filter, kept in the URL.
- **English and Persian** (right to left, Persian or Latin digits), light and
  dark themes.

## Stack

React 19 + React Compiler, Vite, TypeScript (strict), TanStack Router, Query
and Table, Zustand + zundo, DuckDB-WASM, Apache ECharts, react-grid-layout,
dnd-kit, React Hook Form + Zod, Tailwind CSS v4 + Radix, i18next. Feature-Sliced
Design checked by Steiger. Vitest and Playwright (with axe).

## Scripts

```sh
git submodule update --init   # formweave packages (form-builder)
pnpm install
pnpm dev          # start the app
pnpm check        # lint, Steiger, format, typecheck, unit tests, build
pnpm e2e          # Playwright end-to-end tests
pnpm data         # regenerate the sample Parquet files
```

## Docs

- `docs/brief.md`: the project brief
- `docs/decisions.md`: decisions made during the build
- `docs/build-log.md`: how the app was built, and a code walkthrough plan
- `docs/deploy.md`: Nginx setup for the static site
- `docs/mockups/`: approved design mockups

The sample data is synthetic.
