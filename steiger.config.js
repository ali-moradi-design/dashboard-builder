import fsd from '@feature-sliced/steiger-plugin'
import { defineConfig } from 'steiger'

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // Slices are added step by step; a slice used by one page for now is fine.
    rules: { 'fsd/insignificant-slice': 'off' },
  },
])
