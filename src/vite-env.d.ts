interface ImportMetaEnv {
  /** "true" when the deployment has the VEX API proxy configured. Not a secret. */
  readonly VITE_LIVE_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
