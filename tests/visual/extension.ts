import { chromium, test as base } from "@playwright/test";
import type { BrowserContext } from "@playwright/test";

const distDir = decodeURIComponent(
  new URL("../../dist", import.meta.url).pathname,
);

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext("", {
      channel: "chromium",
      args: [
        `--disable-extensions-except=${distDir}`,
        `--load-extension=${distDir}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    const worker =
      context.serviceWorkers()[0] ??
      (await context.waitForEvent("serviceworker"));
    await use(new URL(worker.url()).host);
  },
});

export const expect = test.expect;
