import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import fp from 'eslint-plugin-fp';
import reactHooks from 'eslint-plugin-react-hooks';
import jsdoc from 'eslint-plugin-jsdoc';

export default tseslint.config(
  eslint.configs.recommended,

  // JSDoc base preset — TypeScript-aware (no type duplication in JSDoc).
  jsdoc.configs['flat/recommended-typescript'],

  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommendedTypeChecked],
    plugins: { fp, reactHooks, jsdoc },
    rules: {
      // FP rules
      'fp/no-mutation': 'error',
      'fp/no-let': 'warn',
      'fp/no-loops': 'warn',

      // TypeScript rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',

      // React Hooks rules
      'reactHooks/rules-of-hooks': 'error',
      'reactHooks/exhaustive-deps': 'warn',

      // JSDoc rules — AGENTS.md requires every exported function to have
      // JSDoc with: what it does, parameters, return value, side effects,
      // and domain invariants.
      //
      // We keep the rules lightweight: TypeScript already provides types, so
      // we do not duplicate parameter/return types in JSDoc. We only enforce
      // the presence of documentation, descriptions, and our custom tags.
      'jsdoc/require-jsdoc': ['error', {
        require: {
          FunctionDeclaration: false,
          FunctionExpression: false,
          ArrowFunctionExpression: false,
          ClassDeclaration: false,
          ClassExpression: false,
          MethodDefinition: false,
        },
        contexts: [
          // Exported functions and arrow functions
          'ExportNamedDeclaration > FunctionDeclaration',
          'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression',
          'ExportNamedDeclaration > TSDeclareFunction',
          'MethodDefinition[accessibility="public"]',
        ],
        checkConstructors: false,
        checkGetters: false,
        checkSetters: false,
      }],
      'jsdoc/require-description': ['error', {
        contexts: [
          'ExportNamedDeclaration > FunctionDeclaration',
          'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression',
          'ExportNamedDeclaration > TSDeclareFunction',
        ],
        checkConstructors: false,
      }],
      // We document parameters through named prop interfaces in TypeScript,
      // so we do not require (or check) duplicated @param tags.
      'jsdoc/require-param': 'off',
      'jsdoc/require-param-description': 'off',
      'jsdoc/check-param-names': 'off',
      // We document return semantics in JSDoc, but TS already types them.
      'jsdoc/require-returns': ['error', {
        checkConstructors: false,
        contexts: [
          'ExportNamedDeclaration > FunctionDeclaration',
          'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression',
          'ExportNamedDeclaration > TSDeclareFunction',
        ],
      }],
      'jsdoc/require-returns-description': 'error',
      'jsdoc/require-returns-check': 'error',
      // TypeScript already types parameters/returns; no need to duplicate.
      'jsdoc/require-param-type': 'off',
      'jsdoc/require-returns-type': 'off',
      // Formatting / style — kept as warnings so they do not block CI.
      'jsdoc/check-indentation': 'off',
      'jsdoc/check-alignment': 'warn',
      'jsdoc/require-hyphen-before-param-description': 'off',
      'jsdoc/require-description-complete-sentence': 'off',
      'jsdoc/tag-lines': 'off',
      'jsdoc/sort-tags': 'off',
      'jsdoc/require-throws': 'off',
      'jsdoc/require-example': 'off',
      'jsdoc/no-defaults': 'off',
      // Allow AGENTS.md custom tags: sideEffects, invariants.
      'jsdoc/check-tag-names': ['warn', {
        definedTags: ['sideEffects', 'invariants'],
      }],
      // Allow JSDoc to reference TS types without importing them as deps.
      'jsdoc/imports-as-dependencies': 'off',
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      jsdoc: {
        mode: 'typescript',
        tagNamePreference: {
          returns: 'returns',
          param: 'param',
        },
      },
    },
  },
);
