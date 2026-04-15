import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    globals:     true,
    environment: 'node',
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
    coverage: {
      provider:   'v8',
      reporter:   ['text', 'lcov'],
      include:    ['src/**/*.ts'],
      exclude:    ['src/main.ts', 'src/container/**'],
    },
  },
  resolve: {
    alias: {
      '@domain':         resolve(__dirname, 'src/domain'),
      '@application':    resolve(__dirname, 'src/application'),
      '@infrastructure': resolve(__dirname, 'src/infrastructure'),
      '@presentation':   resolve(__dirname, 'src/presentation'),
      '@config':         resolve(__dirname, 'src/config'),
      '@container':      resolve(__dirname, 'src/container'),
    },
  },
});
