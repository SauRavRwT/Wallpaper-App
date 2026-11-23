import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/Wallpaper-App/",
  plugins: [react({ include: /\.[jt]sx?$/ })],
  test: {
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
  },
});
