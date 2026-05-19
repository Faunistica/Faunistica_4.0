import { defineConfig } from 'oxlint';

export default defineConfig({
    options: {
        typeAware: true,
    },
    plugins: ['react', 'react-perf', 'import', 'typescript', 'unicorn', 'oxc'],
    categories: {
        correctness: 'error',
        suspicious: 'warn',
    },
    rules: {
        'react/react-in-jsx-scope': 'off',
    },
    env: {
        browser: true,
    },
    ignorePatterns: ['dist'],
});
