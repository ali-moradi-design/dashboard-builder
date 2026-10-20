# Build log and code walkthrough plan

Everything done to build the dashboard builder (session of 2026-10-20), in
order. A later session uses this file to explain the code to the user step by
step. Explanations are in Persian; this file is in English like the rest of
the repo.

## How to use this file in the walkthrough session

- Go one part at a time, in the order of "Walkthrough plan" below. Do not
  explain later parts in advance.
- For each part: why it exists, the files (open them), the main idea in the
  code, a small exercise or question, and what the tests show.
- Use `graphify query "<question>" --budget 1500` (run `graphify update .`
  first in a fresh clone) to find where things are used, instead of reading
  many files.
- Run the app while explaining: `git submodule update --init`, `pnpm install`,
  `pnpm dev`.

## Timeline (pull requests)

| PR  | What                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| #1  | `docs/brief.md`, `CLAUDE.md`, `.gitignore`. The empty repo got a `main` branch first (initial README).                                      |
| #2  | Design mockups (HTML/CSS rendered to PNG with Playwright): dashboard view, edit mode with settings panel, query builder; dark/light, en/fa. |
| #3  | Mockup revision: 4 more chart types (area, stacked bar, scatter, heatmap), TanStack-style table, donut and preview fixes.                   |
| #4  | Heading and text widgets; compact numbers keep `K` in Persian. Mockups approved.                                                            |
| #5  | v0.1 scaffold.                                                                                                                              |
| #6  | v0.2 data layer and query engine.                                                                                                           |
| #7  | v0.3 widgets and dashboard view.                                                                                                            |
| #8  | v0.4 editor.                                                                                                                                |
| #9  | v1.0 export/import, docs, GitHub Actions CI (first CI run green).                                                                           |
| #10 | formweave settings forms from the form-builder submodule.                                                                                   |

Version split agreed with the user: 0.1 foundation, 0.2 data + query engine,
0.3 widgets + view, 0.4 editor, 1.0 storage, sharing and polish. The user asked
to skip CI until the end and to test every PR locally (`pnpm check`,
`pnpm e2e`) before merging.

## Prerequisites found at the start

- Node in the sandbox was 22; current LTS is 24 (form-builder needs `>=24`),
  so Node 24 was used. pnpm 10.28, Playwright with a preinstalled Chromium.
- The repo was empty (no `main`). GitHub push worked.
- form-builder was readable: packages `schema`, `engine`, `react`
  (`@formweave/*`), built but not published.

## Walkthrough plan

### Part 1 — Project setup (PR #5)

Files: `package.json`, `vite.config.ts`, `tsconfig.json`,
`eslint.config.js`, `steiger.config.js`, `.prettierrc.json`,
`playwright.config.ts`, `vitest.setup.ts`, `index.html`.

- Vite 8 with `@vitejs/plugin-react` and the React Compiler through the Babel
  preset (`reactCompilerPreset` + `@rolldown/plugin-babel`).
- TypeScript 6 strict (`noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`). Not TS 7: typescript-eslint supports up to 6.
- ESLint flat config: strict type-checked, react-hooks, jsx-a11y. Prettier
  with the Tailwind plugin. lint-staged runs on a pre-commit hook
  (simple-git-hooks).
- Feature-Sliced Design layers in `src/`: `app → pages → widgets → features
→ entities → shared`. Steiger checks the rules (public `index.ts` per
  slice, no cross-imports inside a layer).
- Concepts to explain: what each layer may import; the `@x` cross-import
  notation (`entities/dataset/@x/query.ts`, `@x/widget.ts`,
  `entities/widget/@x/dashboard.ts`).

### Part 2 — App shell, theme and languages (PR #5)

Files: `src/app/*`, `src/shared/model/settings.ts`, `src/shared/i18n/*`,
`src/shared/lib/format.ts`, `src/features/switch-*`,
`src/widgets/app-header`, `src/app/styles/index.css`.

- Settings store (Zustand + `persist`): language, theme (light/dark/system),
  digits (native/Latin).
- `useDocumentSettings` sets `<html lang dir data-theme>`.
- Design tokens as CSS variables (light and dark from the approved palette,
  WCAG AA checked) mapped into Tailwind v4 with `@theme inline`.
- i18next with typed keys (`i18next.d.ts`).
- `formatNumber` / `formatDate`: `Intl` with the Gregorian calendar and
  native or Latin digits; compact numbers keep the K/M suffix in Persian.
- Router: TanStack Router, code-based routes, the date filter lives in search
  params (`?from&to`), heavy pages are lazy-loaded.

### Part 3 — Sample data (PR #6)

Files: `scripts/generate-datasets.mjs`, `public/data/*.parquet`.

- Synthetic, deterministic data made with SQL inside DuckDB (Node build of
  DuckDB-WASM): a hash-based random function, growth over time, weekday and
  hour patterns, discounts that lower profit. `COPY … TO parquet`.
- 61,519 orders (616 KB) and 10,960 weather rows (75 KB). `pnpm data`
  regenerates them.

### Part 4 — The query engine: JSON → SQL (PR #6)

Files: `src/shared/lib/query-engine/{spec,compile,errors,hash}.ts` and the
tests `compile.test.ts`, `execute.test.ts`.

- Query spec (Zod): measures (sum/avg/count/min/max), up to two group-bys
  (dates by day/week/month/year), AND filters, sort, limit.
- Safety: identifiers must exist in the dataset schema and are quoted; every
  value is a bound parameter (`?`). Tests try SQL injection.
- Output: SQL, params, result columns, and a hash used as the cache key.
- `execute.test.ts` runs the compiled SQL on the real Parquet file.
- No React here, so it can become a package later.

### Part 5 — DuckDB in the browser (PR #6)

Files: `src/shared/lib/duckdb/*`, `src/entities/dataset/*`,
`src/features/import-dataset`, `src/pages/datasets`,
`src/shared/lib/storage`.

- DuckDB-WASM in a Web Worker (bundle chosen by `selectBundle`; `?url`
  imports for wasm and worker files).
- Cancellable queries: one connection per query, `AbortSignal` →
  `conn.cancelSent()`.
- Arrow → plain rows (dates as `YYYY-MM-DD`, big ints as numbers). Arrow is
  pinned to 17 to match DuckDB.
- Datasets: field type, en/fa label, format, `display` hint (weekday, hour).
  Parquet is registered by URL; CSV bytes are stored in IndexedDB (`idb`) and
  loaded into DuckDB, so files never leave the browser.
- Bug met: DuckDB transfers the buffer to its worker, which detached the
  bytes saved to IndexedDB; fixed by passing a copy.
- `useQueryResult` (TanStack Query): key = compiled SQL hash, previous data
  kept while a new query runs.

### Part 6 — Widgets and charts (PR #7)

Files: `src/entities/widget/*`, `src/shared/lib/echarts/*`,
`src/shared/ui/data-table.tsx`, `src/shared/lib/markdown/*`.

- Widget registry: 11 types, each with query requirements, default and min
  size (`model/definitions.ts`), a Zod settings schema with safe defaults
  (`model/settings.ts`), and a renderer (`ui/registry.tsx`).
- `toSeries` shapes rows for charts (one dimension: one series per measure;
  two dimensions: the second splits the series).
- ECharts: only the needed chart types are imported (tree-shaking), a small
  own React wrapper, colors read from CSS tokens (`useChartTheme`). In
  Persian, category axes run right to left and value axes sit on the right.
- Table widget on TanStack Table v9 (sorting, pagination).
- Text widget: safe Markdown subset that builds a tree (no `innerHTML`;
  only http/https/mailto links).

### Part 7 — Dashboards and the view page (PR #7)

Files: `src/entities/dashboard/*`, `src/widgets/widget-frame`,
`src/widgets/dashboard-grid/ui/DashboardGrid.tsx`,
`src/features/apply-date-filter`, `src/pages/dashboard-view`,
`src/pages/dashboards-list`.

- Dashboard JSON: Zod schema with `schemaVersion` and a migration hook;
  IndexedDB repository; the sample "Sales overview" dashboard is seeded once.
- `WidgetFrame`: loading, empty, error and "not set up" states.
- View grid: a 12-column CSS grid that mirrors itself in RTL and stacks on
  phones.
- Date filter: year presets from the dataset's date span, custom range,
  stored in the URL.
- RTL details: `unicode-bidi: plaintext` for user text, `<bdi>` in table
  cells.

### Part 8 — The editor (PR #8)

Files: `src/entities/dashboard/model/editor.ts`, `src/features/undo-redo`,
`src/features/add-widget`, `src/widgets/dashboard-grid/ui/EditableGrid.tsx`,
`src/widgets/widget-settings-panel`, `src/pages/dashboard-edit`.

- Editor store: Zustand + zundo. Only the dashboard document is tracked, so
  every edit can be undone. Quick typing merges into one step (coalesce key).
  The zundo `equality` option stops selection changes from becoming history.
- Shortcuts: Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Ctrl+Y (not inside text fields);
  Delete removes the selected widget.
- Autosave to IndexedDB 500 ms after a change.
- react-grid-layout v2: drag and resize; in RTL the x coordinate is mirrored
  on the way in and out.
- Palette → grid uses native drag events (react-grid-layout's drop target
  needs them). Bug met: the grid element had zero height when empty, so drops
  failed; fixed with a minimum height.
- New widgets get a sensible default query (`defaultQuery`).

### Part 9 — The query builder (PR #8)

Files: `src/widgets/query-builder-panel/*`,
`src/entities/query/lib/{draft,describe}.ts`.

- Pure draft helpers (add measure/group-by/filter from a field, remove,
  `runnable` drops half-filled filters), with tests.
- dnd-kit: fields are draggable, zones are droppable; a "+" menu does the
  same with the keyboard.
- The query as a sentence (`describeQuery`), live preview with a chart-type
  switcher.

### Part 10 — Settings forms with formweave (PR #8, #10)

Files: `src/entities/widget/config/settingsForms.ts`,
`src/shared/lib/settings-form/*`, `vite.config.ts`, `tsconfig.json`,
`.gitmodules`.

- Settings forms are formweave `FormDocument` JSON, one per widget type.
- First a temporary React Hook Form renderer (installing formweave was
  blocked); after the user allowed it, form-builder became a git submodule
  (`vendor/form-builder`, pinned `bf30d86`), compiled from source through
  Vite/TS aliases, and the adapter switched to `@formweave/react`.
- Problems found in formweave and filed in form-builder: #44 `className`
  drops `fw-form`, #45 dark mode follows the OS not the host, #46 choice
  values must be strings, #47 packages not installable from GitHub.
- A unit test compiles every settings form with the real engine.

### Part 11 — Sharing, tests, CI and deploy (PR #9)

Files: `src/features/export-import-dashboard`, `e2e/*`,
`.github/workflows/ci.yml`, `docs/deploy.md`, `docs/decisions.md`,
`README.md`.

- Export as JSON; import validates (schema + migrations) and never
  overwrites (new id on conflict).
- Tests: 70 unit tests (Vitest), 15 E2E tests (Playwright) including axe
  checks, a full flow (build, query, view, export, import), drag and drop,
  undo/redo, RTL.
- CI: install → lint (ESLint + Steiger) → format → typecheck → unit → build →
  E2E; checks out submodules.
- Deploy: static site; Nginx with SPA fallback, long cache for hashed assets,
  wasm MIME type and gzip.

## Problems met during the build (good teaching examples)

- Squash merges left the session branch with old commits → PR conflicts;
  fixed by resetting the branch to `origin/main` after each merge.
- ECharts with `preserveAspectRatio` stretched text; charts are sized to
  their container instead.
- `dir="auto"` left-aligned English titles on Persian pages; replaced by
  `unicode-bidi: plaintext`.
- axe found: link name not matching visible text, heading order, duplicate
  landmarks, missing `h1`; all fixed.
- The default TanStack Table sort follows the query's sort.

## Still open

- Mark the `ci` check as required on `main` (GitHub settings, user).
- When formweave is on npm: replace the submodule and aliases with the npm
  packages.
- Deploy to the VPS (roadmap phase 7).
