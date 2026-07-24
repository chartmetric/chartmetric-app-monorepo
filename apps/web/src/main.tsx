import type { FC } from "react";

import { Counter } from "@repo/ui/counter";
import { Header } from "@repo/ui/header";
import { createRoot } from "react-dom/client";

import typescriptLogo from "/typescript.svg";

import "./style.css";

const App: FC = () => (
  <div>
    <a href="https://vitejs.dev" rel="noreferrer" target="_blank">
      <img alt="Vite logo" className="logo" src="/vite.svg" />
    </a>
    <a href="https://www.typescriptlang.org/" rel="noreferrer" target="_blank">
      <img
        alt="TypeScript logo"
        className="logo vanilla"
        src={typescriptLogo}
      />
    </a>
    <Header title="Web" />
    <div className="card">
      <Counter />
    </div>
  </div>
);

const container = document.querySelector("#app");
if (container === null) {
  throw new Error("Root element #app not found");
}
createRoot(container).render(<App />);
