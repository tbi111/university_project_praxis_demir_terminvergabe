import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: {
    globalSetup: ["tests/testdatenbank.ts"],
    fileParallelism: false,
    env: { DATABASE_URL: "file:./prisma/test.db", TZ: "UTC" },
  },
});
