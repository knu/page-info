import { defineConfig } from "@playwright/test";

// Visual regression tests for the extension UI.  Local-only for now;
// screenshot baselines are platform-dependent.
export default defineConfig({
  testDir: "tests/visual",
  fullyParallel: false,
  workers: 1,
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      maxDiffPixelRatio: 0.01,
    },
  },
});
