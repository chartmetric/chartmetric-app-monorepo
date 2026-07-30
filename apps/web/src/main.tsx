import { config } from "@fortawesome/fontawesome-svg-core";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { baseTheme } from "@repo/ui/theme";
import { createRoot } from "react-dom/client";

import { App } from "./App";
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

createRoot(container).render(
  <I18nProvider i18n={i18n}>
    <MantineProvider defaultColorScheme="auto" theme={baseTheme}>
      <ModalsProvider>
        <App />
      </ModalsProvider>
    </MantineProvider>
  </I18nProvider>,
);
