/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_PROJECT_ID: string
    readonly VITE_BACKEND_URL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

declare module 'gray-matter';
