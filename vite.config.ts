import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Relative asset paths so the build works under a GitHub Pages sub-path (/<repo>/).
  base: './',
  test: {
    // Game logic is pure, so tests run in plain Node with no DOM.
    environment: 'node',
  },
})
