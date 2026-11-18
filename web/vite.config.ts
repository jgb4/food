/// <reference types="vitest/config" />
import path from "node:path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// Built files go straight into ../maison-emma, which GitHub Pages serves at /food/maison-emma/.
export default defineConfig({
  base: "/food/maison-emma/",
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  // heic-to (~3 MB) is a separate chunk that only loads when someone picks a HEIC photo.
  build: { outDir: "../maison-emma", emptyOutDir: true, chunkSizeWarningLimit: 3500 },
  // Port 8643 is allowed by the worker's CORS list for local testing.
  preview: { port: 8643, strictPort: true },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
})
