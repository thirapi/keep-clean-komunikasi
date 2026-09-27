import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Unit tests exercise server modules directly under a non-RSC resolver,
      // where the real `server-only` entry throws. Stub it so the guard still
      // protects the Next.js client build without breaking the test run.
      "server-only": path.resolve(__dirname, "test/server-only-stub.ts"),
    },
  },
});
