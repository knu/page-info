import { expect, test } from "./extension.ts";

const FIXTURE_URL = "https://fixture.test/article";

const ogImage = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="315">
  <rect width="600" height="315" fill="#4a90d9"/>
  <circle cx="300" cy="157" r="100" fill="#f5a623"/>
</svg>`;

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
  <rect width="32" height="32" rx="6" fill="#7ed321"/>
</svg>`;

const fixtureHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Fixture Article - Fixture Site</title>
  <meta name="description" content="A plain meta description.">
  <link rel="canonical" href="${FIXTURE_URL}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${FIXTURE_URL}">
  <meta property="og:site_name" content="Fixture Site">
  <meta property="og:title" content="Fixture Article">
  <meta property="og:description" content="A stable article description used for visual regression testing.">
  <meta property="og:image" content="https://fixture.test/og.svg">
</head>
<body><h1>Fixture Article</h1></body>
</html>`;

test("popup renders the OGP panel for a canonical page", async ({
  context,
  extensionId,
}) => {
  await context.route("https://fixture.test/**", (route) => {
    const url = route.request().url();
    if (url.endsWith("/og.svg")) {
      return route.fulfill({ contentType: "image/svg+xml", body: ogImage });
    }
    if (url.endsWith("/favicon.svg")) {
      return route.fulfill({ contentType: "image/svg+xml", body: favicon });
    }
    return route.fulfill({ contentType: "text/html", body: fixtureHTML });
  });

  const fixture = await context.newPage();
  await fixture.goto(FIXTURE_URL);

  const popup = await context.newPage();
  // The popup closes itself when it cannot find an inspectable tab
  await popup.addInitScript(() => {
    window.close = () => {};
  });
  await popup.setViewportSize({ width: 400, height: 360 });
  // The popup inspects the active http(s) tab, so keep the fixture focused
  await fixture.bringToFront();
  await popup.goto(`chrome-extension://${extensionId}/index.html`);

  await expect(popup.locator("img.og-image")).toBeVisible();
  await expect(popup.locator(".og-icon:not(.placeholder)")).toBeVisible();
  await expect(popup).toHaveScreenshot("popup-og.png");
});

test("options page renders the default form", async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  await page.setViewportSize({ width: 400, height: 420 });
  await page.goto(`chrome-extension://${extensionId}/options.html`);

  await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
  await expect(page).toHaveScreenshot("options.png");
});
