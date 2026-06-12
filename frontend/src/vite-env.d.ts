interface ViteTypeOptions {
    strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_DISABLE_AUTO_SAVE?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
