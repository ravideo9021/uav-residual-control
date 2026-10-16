/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL of a hosted ResLand Streamlit dashboard; when set, the Dashboard page embeds it. */
  readonly VITE_DASHBOARD_URL?: string;
}

declare module "virtual:resland-content" {
  const content: unknown;
  export default content;
}
