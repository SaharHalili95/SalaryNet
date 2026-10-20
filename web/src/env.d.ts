/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEMO_MODE?: string
  readonly VITE_API_URL?: string
  /** Where the Angular version runs when not in demo mode (for example http://localhost:4200). */
  readonly VITE_ANGULAR_URL?: string
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}
