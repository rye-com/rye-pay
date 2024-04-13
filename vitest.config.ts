import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: '.',
    bail: 1,
    maxConcurrency: 1,
    environment: 'jsdom',
    coverage: {
      enabled: true,
      provider: 'istanbul', // or 'v8'
      // reporter: 'json',
    },

    // Automatically clear mock calls, instances, contexts and results before every test
    clearMocks: true,
  },
});
