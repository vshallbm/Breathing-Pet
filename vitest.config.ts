import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/vite-env.d.ts',
        'src/assets/**',
        // UI entry points tested via E2E, not unit tests
        'src/popup/popup.ts',
        'src/options/options.ts',
        'src/onboarding/onboarding.ts',
        'src/privacy/**',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 55,
        statements: 60,
      },
      reporter: ['text', 'html', 'lcov'],
    },
  },
});
