import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      '0.0.0.0',
      'new-app.chartmetric.com'
    ]
  }
});
