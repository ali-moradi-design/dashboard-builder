import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const formweave: [RegExp, string][] = [
  [/^@formweave\/schema$/, 'schema/src/index.ts'],
  [/^@formweave\/schema\/meta$/, 'schema/src/meta.ts'],
  [/^@formweave\/engine$/, 'engine/src/index.ts'],
  [/^@formweave\/engine\/fields$/, 'engine/src/fields/index.ts'],
  [/^@formweave\/engine\/fields\/all$/, 'engine/src/fields/all.ts'],
  [/^@formweave\/engine\/(expr|i18n|infer|messages)$/, 'engine/src/$1.ts'],
  [/^@formweave\/react$/, 'react/src/index.ts'],
  [/^@formweave\/react\/fields$/, 'react/src/fields/index.ts'],
  [/^@formweave\/react\/styles\.css$/, 'react/styles.css'],
]

export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
  resolve: {
    alias: [
      { find: /^@\//, replacement: fileURLToPath(new URL('./src/', import.meta.url)) },
      // formweave packages from the form-builder submodule (not on npm yet), compiled from source.
      ...formweave.map(([find, file]) => ({
        find,
        replacement: fileURLToPath(
          new URL(`./vendor/form-builder/packages/${file}`, import.meta.url),
        ),
      })),
    ],
  },
  worker: { format: 'es' },
  optimizeDeps: { exclude: ['@duckdb/duckdb-wasm'] },
  build: { target: 'es2023', chunkSizeWarningLimit: 1500 },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    css: false,
  },
})
