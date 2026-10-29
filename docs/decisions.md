# Decisions made during the build

Changes to or details of the brief, with the reason.

- **TypeScript 6, not 7.** typescript-eslint supports TypeScript up to 6.0, so
  the strict type-checked lint rules need TS 6.
- **Apache Arrow 17.** DuckDB-WASM depends on Arrow 17; one copy avoids type
  and runtime mismatches.
- **DuckDB-WASM `latest` tag (1.33 dev).** The npm `latest` tag points to the
  1.33 development line; the last plain release is older.
- **Palette drag uses native drag events.** react-grid-layout's drop target
  (with the placeholder that shows where the widget will land) only listens to
  native HTML drag events. Field drag in the query builder uses dnd-kit as
  planned. Every drag has a keyboard or click alternative.
- **Widget settings forms.** Each form is a formcanvas `FormDocument` (JSON) in
  `entities/widget/config/settingsForms.ts`, rendered by the formcanvas engine
  through `shared/lib/settings-form`. The packages (`@formcanvas/schema`,
  `@formcanvas/engine`, `@formcanvas/react`) come from npm at pinned versions.
  They were first a git submodule compiled from source through Vite and
  TypeScript path aliases, while they were not published (as `@formweave/*`).
  The form is themed by mapping the `--fc-*` variables onto the app tokens. A
  unit test compiles every settings form with the real engine.
- **Scatter and heatmap data.** Scatter plots aggregate per group (first
  group-by = point, second = color). The sample data has weekday and hour
  fields with a `display` hint so the heatmap shows day names and times.
- **Compact numbers** keep the K/M suffix in Persian too (user decision).
- **CI** was added at the end of the build (user decision); until then every
  PR was checked locally with `pnpm check` and `pnpm e2e`.
