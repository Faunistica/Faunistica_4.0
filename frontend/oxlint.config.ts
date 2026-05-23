import { defineConfig } from 'oxlint';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';

export default defineConfig({
    options: {
        typeAware: true,
    },
    plugins: ['react', 'react-perf', 'import', 'typescript', 'unicorn', 'oxc', 'promise'],
    jsPlugins: [
        {
            name: 'react-hooks-js',
            specifier: 'eslint-plugin-react-hooks',
        },
        {
            name: 'better-tailwindcss',
            specifier: 'eslint-plugin-better-tailwindcss',
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
        'react/react-in-jsx-scope': 'off',
        'react-hooks-js/set-state-in-render': 'error',
        'better-tailwindcss/enforce-consistent-line-wrapping': 'off',
        // TODO: turn on later
        'better-tailwindcss/enforce-canonical-classes': 'off',
    },
    overrides: [
        {
            files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/tests/**'],
            rules: {
                'typescript/no-unsafe-type-assertion': 'off',
            },
        },
    ],
    env: {
        browser: true,
    },
    ignorePatterns: ['dist'],
});
