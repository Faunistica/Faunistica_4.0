import type { KnipConfig } from 'knip';

const config: KnipConfig = {
    entry: ['src/main.tsx'],
    project: ['src/**/*.{ts,tsx}'],
    ignoreDependencies: [
        'tailwindcss',
        'tw-animate-css',
        '@fontsource-variable/geist',
        'shadcn',
    ],
};

export default config;
