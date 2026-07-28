import { defineConfig } from "@lingui/cli";
import { linguiBase } from "@repo/lingui-config/base";

export default defineConfig({
  ...linguiBase,
  catalogs: [
    {
      exclude: ["**/node_modules/**"],
      include: ["src"],
      path: "<rootDir>/src/locales/{locale}/messages",
    },
  ],
});
