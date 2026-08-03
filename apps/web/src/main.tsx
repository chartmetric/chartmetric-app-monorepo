import { config } from "@fortawesome/fontawesome-svg-core";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { RequiredAuthProvider } from "@propelauth/react";
import { baseTheme } from "@repo/ui/theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import cmLogo from "./assets/cm-logo.svg";
import { env } from "./env";
import { detectLocale, dynamicActivate } from "./i18n";

import "@fontsource-variable/inter";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "@mantine/core/styles.css";
import "@mantine/charts/styles.css";

// The stylesheet is imported above; per-icon inline <style> injection is
// redundant and breaks strict Content-Security-Policy setups.
config.autoAddCss = false;

const container = document.querySelector("#app");
if (container === null) {
  throw new Error("Root element #app not found");
}

await dynamicActivate(detectLocale());

const queryClient = new QueryClient();

// Shown while PropelAuth checks the session, before any provider below is
// mounted — plain markup only (no Mantine/i18n context exists yet).
const authLoadingFallback = (
  <div
    aria-busy="true"
    style={{
      alignItems: "center",
      display: "flex",
      height: "100vh",
      justifyContent: "center",
    }}
  >
    <img alt="" src={cmLogo} width={160} />
  </div>
);

createRoot(container).render(
  <RequiredAuthProvider
    authUrl={env.propelauthAuthUrl}
    displayWhileLoading={authLoadingFallback}
  >
    <QueryClientProvider client={queryClient}>
      <I18nProvider i18n={i18n}>
        <MantineProvider defaultColorScheme="auto" theme={baseTheme}>
          <ModalsProvider>
            <App />
          </ModalsProvider>
        </MantineProvider>
      </I18nProvider>
    </QueryClientProvider>
  </RequiredAuthProvider>,
);
