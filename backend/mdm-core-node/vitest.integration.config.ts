import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    globals:     true,
    environment: 'node',
    include:     ['tests/integration/**/*.test.ts'],
    setupFiles:  ['./tests/integration/helpers/setup.ts'],
    testTimeout:  60_000,
    hookTimeout:  60_000,
    pool:        'forks',
    poolOptions: { forks: { singleFork: true } },
    typecheck: {
      tsconfig: './tsconfig.test.json',
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
