# Dashboard builder: brief

Decisions from 2026-10-19. Demo 3 in notes/demos.md. Built in the public repo
`ali-moradi-design/dashboard-builder` (created by the user) in its own sessions;
this file is the handoff and is safe to make public.

## How the build session starts

1. Check the prerequisites (below) and report before writing code.
2. Copy this brief into the repo as `docs/brief.md`.
3. Design first: mockups as images (HTML/CSS rendered to PNG with Playwright) of
   the dashboard view, the edit mode with the widget settings panel, and the query
   builder, in dark and light, English and Persian, using the palette below. No app code before approval.
4. Split the scope into versions with the user, then build step by step in small
   PRs (branch → PR → CI → squash merge), explaining each step.

Language rules: explain in Persian, every English term inside parentheses and
backticks, never start a line with an English word, repo files in English.
Do not copy code from the user's former employer's dashboard builder; only the
experience is reused.

## Prerequisites to check first

- `git`, `node` (current LTS), `pnpm`.
- The folder is a clone of `ali-moradi-design/dashboard-builder`, on `main`,
  clean; report what is already in it.
- GitHub fetch/push works.
- Playwright runs locally (mockups and E2E).
- The form builder repo `ali-moradi-design/form-builder` is readable (its engine
  and renderer packages are built but not published on npm yet).
- Read the current docs of DuckDB-WASM, ECharts, react-grid-layout, TanStack
  Router/Query and the FSD methodology before coding.

## Concept

Users build dashboards from data without code, like Metabase, Grafana or Looker
Studio:

1. Data source: pick a dataset (built-in sample or the user's own CSV/Parquet).
2. Query: say what you want without SQL ("sum of sales by month, Germany only").
3. Widget: show the result as a chart, table or KPI card.
4. Dashboard: arrange widgets by drag and resize; add global filters.

## Decisions

- Static app, no server: queries run in the browser with DuckDB-WASM (real SQL
  on hundreds of thousands of rows, inside a Web Worker). The user's own files
  never leave the browser. Deploys through roadmap phase 7 (static).
- Charts: Apache ECharts (Apache-2.0, many chart types, canvas, handles large data).
- Languages: English (default) and Persian (RTL), same rules as the other demos
  (logical CSS, native digits by default with a Latin-digit setting, Gregorian
  calendar, Vazirmatn for Persian).
- React (Vite), Feature-Sliced Design, ESLint, Prettier.
- Dashboards saved in IndexedDB; export/import as JSON (that is how they are shared).

## Scope: minimal (decided 2026-10-19)

The user wants this project small and simple: just enough to work well. Do not
add features beyond this list without asking.

- Data: two built-in sample datasets (Parquet in `public/`, small files, long
  cache headers) plus importing the user's own CSV. Dataset definitions give
  fields a type, a label (en/fa) and a format.
- Query builder (no SQL): pick measures with one aggregation each (sum, avg,
  count, min, max), group by one or two fields (date fields by day, week, month
  or year), simple filters (AND list), sort, limit. Queries are stored as JSON and
  compiled to safe, parameterized SQL.
- Widgets (9 types): KPI card, line chart, area chart, bar chart, stacked bar
  chart, pie/donut chart, scatter plot, heatmap (e.g. weekday × hour), table.
  The four extra chart types were added by the user on 2026-10-20.
- The table widget is built with TanStack Table (sortable columns, pagination),
  in the widget and in the query builder preview.
- Drag and drop everywhere it helps: drag a widget type from a palette onto the
  grid, move and resize widgets on the grid, and drag dataset fields into the
  query builder (measures, group by, filters).
- Undo/redo for every dashboard edit (add, move, resize, delete, settings,
  query), with keyboard shortcuts (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z).
- Dashboard: grid with drag and resize; one global date-range filter; one ready
  sample dashboard; several dashboards saved in IndexedDB; export/import a
  dashboard as JSON.
- Light and dark themes; English and Persian.

Not in scope (maybe later, only if the user asks): raw SQL mode, cross-filtering,
drill-down, chart types beyond the nine above, maps, pivot tables, auto refresh, PNG/CSV
export, templates gallery.

## Colors

Palette from https://coolors.co/393d3f-fdfdff-c6c5b9-62929e-546a7b :

- `#393D3F` onyx (dark)
- `#FDFDFF` ghost white (light)
- `#C6C5B9` silver / warm gray
- `#62929E` muted teal (accent)
- `#546A7B` slate blue-gray (secondary)

Build light and dark themes from these as semantic tokens (background, surface,
border, text, muted text, accent, chart series). Dark: onyx-based backgrounds
(darker tints of `#393D3F` for depth), ghost white text. Light: ghost white
background, onyx text. Check WCAG AA contrast for text (4.5:1) and chart marks
(3:1); adjust tints, not hues, where a pair fails. Chart series colors start from
teal, slate and silver, extended with tints/shades, and must stay distinguishable
in both themes.

## Widget settings forms

Every widget type's settings form (axes, colors, labels, number formats) is
defined as JSON and rendered by the form builder engine from the user's
`form-builder` project (the use case from the user's former job, and proof that
the package works in another project).

- The packages are built but not on npm yet: install them from the user's GitHub
  repo for now, pinned to a commit (for example pnpm's git dependency with a
  `#path:` sub-directory, if the package builds on install; otherwise a git
  submodule or a workspace link). Check what works with the repo's setup.
- When the packages are published on npm, switch to the npm version. Keep the
  import behind one small adapter in `shared/lib/settings-form` so the switch is a
  one-file change.

## Architecture (FSD)

```
src/
  app/        providers, router, i18n, theme, DuckDB bootstrap
  pages/      dashboards-list, dashboard-view, dashboard-edit, datasets
  widgets/    dashboard-grid, widget-frame, query-builder-panel,
              widget-settings-panel
  features/   add-widget, edit-query, apply-date-filter, import-dataset,
              export-import-dashboard, undo-redo, switch-language,
              switch-theme
  entities/   dataset, query, widget, dashboard, filter
  shared/     ui, lib/duckdb (worker client), lib/query-engine (JSON → SQL,
              framework-free), lib/echarts (tree-shaken setup), config
```

- Single Vite app (no monorepo needed). `shared/lib/query-engine` stays free of
  React so it can be extracted into a package later.
- Steiger enforces the FSD rules (the portfolio already uses it); imports across
  slices only through each slice's public `index.ts`.
- Widget registry: each widget type is one entry (settings schema, query
  requirements, default size, renderer). New types are added by registering,
  not by changing the core.
- Performance: query results cached by a hash of the compiled SQL; stale queries
  cancelled; ECharts imported per chart type (tree-shaking).

## Libraries (approved by the user)

TanStack Virtual and Monaco were dropped: the minimal scope does not need them.


- Build and language: Vite, React 19 with the React Compiler, TypeScript (strict).
- Routing: TanStack Router (type-safe routes and search params, so filters live in
  the URL).
- State: Zustand for the editor state with zundo for undo/redo; TanStack Query
  for running queries (caching, deduping, cancelling).
- Data: `@duckdb/duckdb-wasm` (results as Apache Arrow).
- Charts: `echarts` with a thin own React wrapper (no extra wrapper library).
- Layout: `react-grid-layout`. Drag from the palette and of fields into the query
  builder: `dnd-kit`.
- Tables: TanStack Table.
- Forms: React Hook Form + Zod (plus the form builder engine, see above).
- UI: Tailwind CSS v4 + shadcn/ui (Radix), lucide icons.
- i18n: i18next + react-i18next; `Intl` for numbers and dates; date-fns for date
  math.
- Storage: `idb` (IndexedDB); dashboard JSON validated with Zod, with a
  `schemaVersion` and migrations.
- Code quality: ESLint (flat config: typescript-eslint, react-hooks, jsx-a11y),
  Prettier with the Tailwind plugin, Steiger (FSD), lint-staged with a pre-commit
  hook.
- Tests: Vitest + Testing Library (heavy unit tests for the JSON → SQL compiler),
  Playwright E2E (build a full dashboard), axe accessibility checks.
- CI on GitHub Actions: install → lint → typecheck → unit → build → E2E; required
  check on `main`.
