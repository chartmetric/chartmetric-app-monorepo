import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { createRoot } from "react-dom/client";

import { App } from "./App";

import "@mantine/core/styles.css";
import "@mantine/charts/styles.css";

const container = document.querySelector("#app");
if (container === null) {
  throw new Error("Root element #app not found");
}
createRoot(container).render(
  <MantineProvider defaultColorScheme="auto">
    <ModalsProvider>
      <App />
    </ModalsProvider>
  </MantineProvider>,
);
