import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { crx, ManifestV3Export } from "@crxjs/vite-plugin";
import manifest from "./manifest.ts";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    crx({ manifest: manifest as unknown as ManifestV3Export }),
  ],
});
