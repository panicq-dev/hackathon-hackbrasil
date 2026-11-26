import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["app/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["app/src/lib/**/*.ts", "app/actions/**/*.ts", "app/actions/**/*.tsx"],
      exclude: ["**/*.test.ts", "app/src/db/**"],
    },
  },
});
