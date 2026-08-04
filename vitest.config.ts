import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Keep Playwright specs under tests/ out of Vitest
    include: ["src/**/*.test.ts"],
  },
});
