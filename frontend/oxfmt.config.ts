import { defineConfig } from 'oxfmt';

export default defineConfig({
    printWidth: 100,
    tabWidth: 4,
    singleQuote: true,
    ignorePatterns: [],
    sortTailwindcss: {
        stylesheet: './src/index.css',
    },
});
