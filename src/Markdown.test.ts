import { describe, expect, it } from "vitest";
import { Markdown, getMarkdownForContext } from "./Markdown.ts";

describe("Markdown.linkedText", () => {
  it("generates a plain link", () => {
    expect(
      Markdown.linkedText({ text: "Example", href: "https://example.com/" }),
    ).toBe("[Example](https://example.com/)");
  });

  it("escapes Markdown metacharacters in the link text", () => {
    expect(
      Markdown.linkedText({
        text: "a [b] *c* _d_ `e` ~f~ \\g",
        href: "https://example.com/",
      }),
    ).toBe("[a \\[b\\] \\*c\\* \\_d\\_ \\`e\\` \\~f\\~ \\\\g](https://example.com/)");
  });

  it("keeps a URL with balanced parentheses intact", () => {
    expect(
      Markdown.linkedText({
        text: "Wiki",
        href: "https://en.wikipedia.org/wiki/Example_(disambiguation)",
      }),
    ).toBe("[Wiki](https://en.wikipedia.org/wiki/Example_(disambiguation))");
  });

  it("percent-encodes unbalanced parentheses in a URL", () => {
    expect(
      Markdown.linkedText({
        text: "Bad",
        href: "https://example.com/a)b",
      }),
    ).toBe("[Bad](https://example.com/a%29b)");
  });

  it("appends a plain title without quoting", () => {
    expect(
      Markdown.linkedText({
        text: "Example",
        href: "https://example.com/",
        title: "A simple title",
      }),
    ).toBe("[Example](https://example.com/ A simple title)");
  });

  it("quotes and escapes a title containing special characters", () => {
    expect(
      Markdown.linkedText({
        text: "Example",
        href: "https://example.com/",
        title: 'He said "hi" (loudly)',
      }),
    ).toBe('[Example](https://example.com/ "He said \\"hi\\" (loudly)")');
  });
});

describe("Markdown.image", () => {
  it("generates an image with alt text", () => {
    expect(
      Markdown.image({ src: "https://example.com/a.png", alt: "Alt" }),
    ).toBe("![Alt](https://example.com/a.png)");
  });

  it("defaults to empty alt text", () => {
    expect(Markdown.image({ src: "https://example.com/a.png" })).toBe(
      "![](https://example.com/a.png)",
    );
  });
});

describe("Markdown.linkedImage", () => {
  it("generates an image wrapped in a link", () => {
    expect(
      Markdown.linkedImage({
        src: "https://example.com/a.png",
        href: "https://example.com/",
        alt: "Alt",
        title: "Image title",
        linkTitle: "Link title",
      }),
    ).toBe(
      "[![Alt](https://example.com/a.png Image title)](https://example.com/ Link title)",
    );
  });
});

describe("getMarkdownForContext", () => {
  const info = (attrs: object) =>
    ({ editable: false, pageUrl: "https://page.example/", ...attrs }) as Parameters<
      typeof getMarkdownForContext
    >[0];
  const tab = { title: "Page Title", url: "https://page.example/" } as chrome.tabs.Tab;

  it("links the current page", () => {
    expect(getMarkdownForContext(info({ menuItemId: "current-page" }), tab)).toBe(
      "[Page Title](https://page.example/)",
    );
  });

  it("returns null for current-page without a tab URL", () => {
    expect(getMarkdownForContext(info({ menuItemId: "current-page" }))).toBeNull();
  });

  it("links a plain link with its text and title", () => {
    expect(
      getMarkdownForContext(
        info({
          menuItemId: "link",
          linkUrl: "https://example.com/",
          linkText: "Click",
          linkTitle: "Title",
        }),
        tab,
      ),
    ).toBe("[Click](https://example.com/ Title)");
  });

  it("generates a linked image for an image link", () => {
    expect(
      getMarkdownForContext(
        info({
          menuItemId: "link",
          mediaType: "image",
          linkUrl: "https://example.com/",
          srcUrl: "https://example.com/a.png",
          imageAlt: "Alt",
        }),
        tab,
      ),
    ).toBe("[![Alt](https://example.com/a.png)](https://example.com/)");
  });

  it("generates an image for an image context", () => {
    expect(
      getMarkdownForContext(
        info({
          menuItemId: "image",
          srcUrl: "https://example.com/a.png",
          imageAlt: "Alt",
          imageTitle: "Title",
        }),
        tab,
      ),
    ).toBe("![Alt](https://example.com/a.png Title)");
  });

  it("throws on an unknown menu item ID", () => {
    expect(() => getMarkdownForContext(info({ menuItemId: "bogus" }), tab)).toThrow(
      TypeError,
    );
  });
});
