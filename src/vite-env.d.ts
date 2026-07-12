/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Public Sanity identifiers for the investor-announcements CMS (build-time).
  readonly VITE_SANITY_PROJECT_ID?: string;
  readonly VITE_SANITY_DATASET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
