/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL: string;
  readonly PUBLIC_BASE_PATH: string;
  readonly PUBLIC_SITE_NAME: string;
  readonly PUBLIC_PACKAGE_VERSION: string;
  readonly PUBLIC_REPO_URL: string;
  readonly PUBLIC_NPM_URL: string;
  readonly PUBLIC_LIVE_DEMO_URL: string;
  readonly PUBLIC_VIDEO_TUTORIAL_URL: string;
  readonly PUBLIC_CANCELABLE_PROMISE_URL: string;
  readonly PUBLIC_GLOBAL_STATE_HOOKS_URL: string;
  readonly PUBLIC_JSON_STORAGE_FORMATTER_URL: string;
  readonly PUBLIC_GITHUB_PROFILE_URL: string;
  readonly PUBLIC_LINKEDIN_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
