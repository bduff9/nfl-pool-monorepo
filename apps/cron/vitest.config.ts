import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["node_modules", "cdk.out"],
    include: ["**/*.test.ts"],
    passWithNoTests: false,
  },
});
