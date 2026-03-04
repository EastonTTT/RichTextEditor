/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_DEV_API_BASE_URL: string
  readonly VITE_COLLAB_WS_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
