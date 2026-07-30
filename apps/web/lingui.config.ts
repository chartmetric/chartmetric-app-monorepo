import { defineConfig } from "@lingui/cli";
import { linguiBase } from "@repo/lingui-config/base";

export default defineConfig({
  ...linguiBase,
  catalogs: [
    {
      exclude: ["**/node_modules/**", "src/pages/**"],
      include: ["src"],
      path: "<rootDir>/src/locales/common/{locale}/messages",
    },
    {
      exclude: ["**/node_modules/**"],
      include: ["src/pages/{name}"],
      path: "<rootDir>/src/locales/{name}/{locale}/messages",
    },
  ],
});
