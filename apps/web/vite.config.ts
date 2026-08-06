import { lingui, linguiTransformerBabelPreset } from "@lingui/vite-plugin";
import babel from "@rolldown/plugin-babel";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      lingui(),
      babel({
        presets: [linguiTransformerBabelPreset()],
      }),
    ],
    server: {
      // A leading dot allows every subdomain, covering generated Railway
      // preview and PR-environment hostnames.
      allowedHosts: ["0.0.0.0", "new-app.chartmetric.com", ".up.railway.app"],
      proxy: {
        "/app": {
          changeOrigin: true,
          target: environment["API_PROXY_TARGET"] ?? "http://127.0.0.1:8008",
        },
      },
    },
  };
});
