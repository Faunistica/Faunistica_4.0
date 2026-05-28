import type { KnipConfig } from 'knip';

const config: KnipConfig = {
    project: ['src/**/*.{ts,tsx}'],
    ignoreIssues: {
        'src/components/ui/*.tsx': ['exports'],
    },
};

export default config;
