// Shared Lingui settings for every workspace that owns translatable strings,
// per https://lingui.dev/guides/monorepo: one root-level config, extended by
// a lingui.config.ts in each package (which adds its own `catalogs`).
export const linguiBase = {
  fallbackLocales: { default: "en" },
  locales: ["de", "en", "es", "fr", "ja", "ko", "pt"],
  sourceLocale: "en",
};
