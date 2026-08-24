import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  root: path.resolve(__dirname),
  base: "./",
  plugins: [react()],
  build: { outDir: path.resolve(__dirname,"../home-assistant-addon/rootfs/app/www"), emptyOutDir: true, target:"es2020", cssMinify:true },
});
