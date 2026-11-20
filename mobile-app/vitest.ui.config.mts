import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Screen/component tests run in jsdom against react-native-web so they can be
 * driven with @testing-library/react. The node project in vitest.config.mts
 * keeps covering the plain lib helpers.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      "react-native": "react-native-web",
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test-utils/screen-setup.ts"],
    include: ["app/**/*.test.tsx", "components/**/*.test.tsx"],
    exclude: ["node_modules/**", "dist/**"],
  },
});
