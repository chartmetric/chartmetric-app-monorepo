// Shared Lingui settings for every workspace that owns translatable strings,
// per https://lingui.dev/guides/monorepo: one root-level config, extended by
// a lingui.config.ts in each package (which adds its own `catalogs`).
// No fallbackLocales on purpose: with the PO format the msgid already is the
// English source text, so untranslated messages render in English anyway —
// and configuring a fallback would make `lingui compile --strict` (the
// pre-commit/CI completeness gate) treat missing translations as covered.
export const linguiBase = {
  locales: ["de", "en", "es", "fr", "ja", "ko", "pt"],
  sourceLocale: "en",
};
