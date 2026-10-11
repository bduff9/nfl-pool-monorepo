import { defineConfig } from "vitest/config";

export default defineConfig({
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    clearMocks: false,
    include: ["src/**/*.test.ts"],
    passWithNoTests: false,
  },
});
