interface ImportMetaEnv {
  /** Comma-separated launch flags to force on at build time, or "all". */
  readonly ALPHA_FLAGS?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
