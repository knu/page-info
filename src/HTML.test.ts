import { describe, expect, it } from "vitest";
import { HTML, getHTMLForContext } from "./HTML.ts";

describe("HTML.linkedText", () => {
  it("generates a plain link", () => {
    expect(HTML.linkedText({ text: "Example", href: "https://example.com/" })).toBe(
      '<a href="https://example.com/">Example</a>',
    );
  });

  it("escapes ampersands and quotes in attributes and text", () => {
    expect(
      HTML.linkedText({
        text: 'Q&A "quoted"',
        href: "https://example.com/?a=1&b=2",
        title: 'The "title" & more',
      }),
    ).toBe(
      '<a href="https://example.com/?a=1&amp;b=2" title="The &quot;title&quot; &amp; more">Q&amp;A &quot;quoted&quot;</a>',
    );
  });

  it("omits null and undefined attributes", () => {
    expect(
      HTML.linkedText({ text: "T", href: "https://example.com/", title: null }),
    ).toBe('<a href="https://example.com/">T</a>');
  });
});

describe("HTML.image", () => {
  it("generates a self-closing img element", () => {
    expect(HTML.image({ src: "https://example.com/a.png", alt: "Alt" })).toBe(
      '<img alt="Alt" src="https://example.com/a.png" />',
    );
  });
});

describe("HTML.linkedImage", () => {
  it("generates an image wrapped in a link", () => {
    expect(
      HTML.linkedImage({
        src: "https://example.com/a.png",
        href: "https://example.com/",
        alt: "Alt",
        title: "Image title",
        linkTitle: "Link title",
      }),
    ).toBe(
      '<a href="https://example.com/" title="Link title"><img alt="Alt" src="https://example.com/a.png" title="Image title" /></a>',
    );
  });
});

describe("getHTMLForContext", () => {
  const info = (attrs: object) =>
    ({ editable: false, pageUrl: "https://page.example/", ...attrs }) as Parameters<
      typeof getHTMLForContext
    >[0];
  const tab = { title: "Page Title", url: "https://page.example/" } as chrome.tabs.Tab;

  it("links the current page", () => {
    expect(getHTMLForContext(info({ menuItemId: "current-page" }), tab)).toBe(
      '<a href="https://page.example/">Page Title</a>',
    );
  });

  it("falls back to 'Link' for empty link text", () => {
    expect(
      getHTMLForContext(
        info({ menuItemId: "link", linkUrl: "https://example.com/", linkText: "" }),
        tab,
      ),
    ).toBe('<a href="https://example.com/">Link</a>');
  });

  it("returns null for an image context", () => {
    expect(
      getHTMLForContext(
        info({ menuItemId: "image", srcUrl: "https://example.com/a.png" }),
        tab,
      ),
    ).toBeNull();
  });

  it("throws on an unknown menu item ID", () => {
    expect(() => getHTMLForContext(info({ menuItemId: "bogus" }), tab)).toThrow(
      TypeError,
    );
  });
});
