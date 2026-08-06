import { lingui, linguiTransformerBabelPreset } from "@lingui/vite-plugin";
import babel from "@rolldown/plugin-babel";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), "");
  const railwayPublicDomain = environment["RAILWAY_PUBLIC_DOMAIN"] ?? "";

  return {
    plugins: [
      react(),
      lingui(),
      babel({
        presets: [linguiTransformerBabelPreset()],
      }),
    ],
    server: {
      // Railway injects each environment's own public hostname, so preview and
      // PR environments are allowed without wildcarding all of *.up.railway.app.
      allowedHosts: [
        "0.0.0.0",
        "new-app.chartmetric.com",
        ...(railwayPublicDomain === "" ? [] : [railwayPublicDomain]),
      ],
      proxy: {
        "/app": {
          changeOrigin: true,
          target: environment["API_PROXY_TARGET"] ?? "http://127.0.0.1:8008",
        },
      },
    },
  };
});
