import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    clearMocks: false,
    include: ["src/**/*.test.ts"],
    passWithNoTests: false,
  },
});
