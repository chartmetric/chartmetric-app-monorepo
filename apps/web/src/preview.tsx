// Screenshot-only entry for the driver session's visual parity loop: the real
// app tree minus RequiredAuthProvider, so a headless browser can render pages
// without a PropelAuth session. Untracked; never ship or import from here.
import { config } from "@fortawesome/fontawesome-svg-core";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { AuthProvider } from "@propelauth/react";
import { baseTheme } from "@repo/ui/theme";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import { env } from "./env";
import { detectLocale, dynamicActivate } from "./i18n";
import { createQueryClient } from "./query-client";

import "@fontsource-variable/inter";
import "@fontsource/space-mono/400.css";
import "@fontsource/space-mono/700.css";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "@mantine/core/styles.css";
import "@mantine/charts/styles.css";

config.autoAddCss = false;

const container = document.querySelector("#app");
if (container === null) {
  throw new Error("Root element #app not found");
}

await dynamicActivate(detectLocale());

createRoot(container).render(
  <AuthProvider authUrl={env.propelauthAuthUrl}>
    <QueryClientProvider client={createQueryClient()}>
      <I18nProvider i18n={i18n}>
        <MantineProvider defaultColorScheme="auto" theme={baseTheme}>
          <ModalsProvider>
            <App />
          </ModalsProvider>
        </MantineProvider>
      </I18nProvider>
    </QueryClientProvider>
  </AuthProvider>,
);
