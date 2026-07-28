import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import { detectLocale, dynamicActivate } from "./i18n";

import "@mantine/core/styles.css";
import "@mantine/charts/styles.css";

const container = document.querySelector("#app");
if (container === null) {
  throw new Error("Root element #app not found");
}

await dynamicActivate(detectLocale());

createRoot(container).render(
  <I18nProvider i18n={i18n}>
    <MantineProvider defaultColorScheme="auto">
      <ModalsProvider>
        <App />
      </ModalsProvider>
    </MantineProvider>
  </I18nProvider>,
);
