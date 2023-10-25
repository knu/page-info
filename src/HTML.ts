const escapees: Record<string, string> = {
  "&": "&amp;",
  '"': "&quot;",
  "<": "&lt;",
  ">": "&gt;",
};

const escapeText = (text: string) =>
  text.replace(/[&"]/g, (match) => escapees[match]);

const escapeAttribute = (key: string, value: string) =>
  `${key}="${escapeText(value)}"`;

const elementHTML = (
  tagName: string,
  attributes: Record<string, string | null | undefined>,
  innerHTML?: string,
) => {
  const t = [
    tagName,
    ...Object.entries(attributes).flatMap(([key, value]) =>
      value == null ? [] : escapeAttribute(key, value),
    ),
  ].join(" ");

  return innerHTML === undefined
    ? `<${t} />`
    : `<${t}>${innerHTML}</${tagName}>`;
};

const linkedText = ({
  text,
  href,
  title,
}: {
  text: string;
  href: string;
  title?: string | null;
}) => elementHTML("a", { href, title }, escapeText(text));

const image = ({
  src,
  alt,
  title,
}: {
  src: string;
  alt?: string | null;
  title?: string | null;
}) => elementHTML("img", { alt, src, title });

const linkedImage = ({
  src,
  href,
  alt,
  title,
  linkTitle,
}: {
  src: string;
  href: string;
  alt?: string | null;
  title?: string | null;
  linkTitle?: string | null;
}) =>
  elementHTML(
    "a",
    { href, title: linkTitle },
    elementHTML("img", { alt, src, title }),
  );

export const HTML = {
  linkedText,
  image,
  linkedImage,
};

import type { ContextAttributes } from "./content";

export const getHTMLForContext: (
  info: chrome.contextMenus.OnClickData & ContextAttributes,
  tab?: chrome.tabs.Tab,
) => string | null = (
  { menuItemId, linkUrl, mediaType, srcUrl, linkText, linkTitle },
  tab,
) => {
  switch (menuItemId) {
    case "current-page":
      if (!tab?.url) return null;

      return linkedText({ text: tab.title ?? "Link", href: tab.url });

    case "link":
      if (!linkUrl) return null;

      // Ignore mediaType; an image element as a clipboard item is not really useful

      return linkedText({
        text: linkText || "Link",
        href: linkUrl,
        title: linkTitle,
      });

    case "image":
      // An image element as a clipboard item is not really useful
      return null;
  }

  throw new TypeError(`unknown context menu ID: ${menuItemId}`);
};
