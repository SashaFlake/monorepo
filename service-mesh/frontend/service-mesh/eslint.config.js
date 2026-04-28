import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import fp from 'eslint-plugin-fp';
import reactHooks from 'eslint-plugin-react-hooks';
import * as effectPlugin from '@effect/eslint-plugin';

export default tseslint.config(
  eslint.configs.recommended,

  // Type-aware rules scoped to source files only
  // (vite.config.ts / vitest.config.ts are excluded to avoid tsconfig issues)
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommendedTypeChecked],
    plugins: { fp, reactHooks, effect: effectPlugin },
    rules: {
      // FP rules
      'fp/no-mutation': 'error',
      'fp/no-let': 'warn',
      'fp/no-loops': 'warn',

      // Effect rules
      ...effectPlugin.configs.recommended.rules,

      // TypeScript rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',

      // React Hooks rules
      'reactHooks/rules-of-hooks': 'error',
      'reactHooks/exhaustive-deps': 'warn',
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
