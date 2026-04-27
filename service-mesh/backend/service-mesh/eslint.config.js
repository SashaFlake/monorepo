import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import fp from 'eslint-plugin-fp';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
        plugins: { fp },
        rules: {
            'fp/no-mutation': 'error',
            'fp/no-let': 'warn',
            'fp/no-loops': 'warn',
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/explicit-function-return-type': 'warn',
        },
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
);