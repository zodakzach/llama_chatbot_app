/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_BACKEND_API_URL: string;
  readonly VITE_BACKEND_API_LOCAL_URL: string;
  // Add other environment variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
