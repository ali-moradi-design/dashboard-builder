# Project instructions

Dashboard builder demo: build dashboards from data without code. The full brief,
decisions, scope and libraries are in `docs/brief.md`. Read it at the start of
every session. Do not add features beyond its scope without asking.

## Workflow

- Small steps: branch → PR → CI → squash merge into `main`. Test every PR
  locally (lint, typecheck, unit, build, E2E) before pushing, then wait for CI
  to be green before merging.
- Explain each step to the user.
- Do not copy code from the user's former employer's dashboard builder.

## Language

- Explain in Persian (Farsi). Put every English term inside parentheses and
  backticks, never start a line with an English word, put a RIGHT-TO-LEFT MARK
  (U+200F) at the start of every bullet and after every English term.
- Files in this repo are written in English.

## graphify

Use graphify in this repo to save tokens once there is code to map:

- Before exploring the codebase, query `graphify-out/` instead of reading many
  files. Read files directly only for the exact lines you will change.
- After each merged PR that adds or moves files, update the graph
  incrementally. Keep `graphify-out/` out of Git (it is in `.gitignore`).
- Do not build a graph for a handful of small files; read them directly.
