import { defineConfig } from 'oxlint';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';
import reactCompiler from 'eslint-plugin-react-compiler';

export default defineConfig({
    options: {
        typeAware: true,
    },
    plugins: ['react', 'react-perf', 'import', 'typescript', 'unicorn', 'oxc', 'promise'],
    jsPlugins: [
        'eslint-plugin-react-refresh',
        'eslint-plugin-better-tailwindcss',
        'eslint-plugin-react-compiler',
        {
            name: 'react-hooks-js',
            specifier: 'eslint-plugin-react-hooks',
        },
    ],
    settings: {
        'better-tailwindcss': {
            entryPoint: 'src/index.css',
        },
    },
    categories: {
        correctness: 'error',
        suspicious: 'warn',
    },
    rules: {
        ...betterTailwindcss.configs.recommended.rules,
        ...reactCompiler.configs.recommended.rules,
        'typescript/no-explicit-any': 'warn',
        'typescript/no-empty-object-type': 'warn',
        'typescript/no-misused-promises': 'off',
        'typescript/no-unsafe-assignment': 'error',
        'react/react-in-jsx-scope': 'off',
        'react-hooks-js/set-state-in-effect': 'warn',
        'react-hooks-js/exhaustive-deps': 'warn',
        'better-tailwindcss/enforce-consistent-line-wrapping': 'off',
        'import/no-unassigned-import': ['warn', { allow: ['**/*.css'] }],
    },
    overrides: [
        {
            files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/tests/**'],
            rules: {
                'typescript/no-unsafe-type-assertion': 'off',
                'typescript/no-unsafe-assignment': 'off',
                'typescript/no-misused-promises': 'off',
                'typescript/strict-void-return': 'off',
                'react-compiler/react-compiler': 'off',
            },
        },
    ],
    env: {
        browser: true,
    },
    ignorePatterns: ['dist'],
});
