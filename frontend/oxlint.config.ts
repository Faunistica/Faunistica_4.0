import { defineConfig } from 'oxlint';

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
    ],
    categories: {
        correctness: 'error',
        suspicious: 'warn',
    },
    rules: {
        'react/react-in-jsx-scope': 'off',
        'react-hooks-js/set-state-in-render': 'error',
    },
    env: {
        browser: true,
    },
    ignorePatterns: ['dist'],
});
