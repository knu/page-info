const escapeLinkText = (text: string) =>
  text.replace(/([\\\[\]*_`~\n])/g, "\\$1");

const escapeHref = (href: string) => {
  const parentheses = href.replace(/[^()]+/g, "");
  if (parentheses.length === 0) return href;

  let unbalanced = parentheses;
  while (true) {
    const next = unbalanced.replace(/\(\)/g, "");
    if (next === unbalanced) break;
    unbalanced = next;
  }

  return unbalanced.length === 0
    ? href
    : href.replace(/[()]+/g, (paren) => encodeURIComponent(paren));
};

const escapeTitle = (title: string) => {
  if (/[\\\'\"()\n]/.test(title)) {
    const escaped = title
      .replace(/([\\\"])/g, "\\$1")
      .replace(/\n([ \f\r\t\v]*\n)+/g, "\n");

    return `"${escaped}"`;
  } else {
    return title;
  }
};

const linkedText = ({
  text,
  href,
  title,
}: {
  text: string;
  href: string;
  title?: string | null;
}) =>
  title
    ? `[${escapeLinkText(text)}](${escapeHref(href)} ${escapeTitle(title)})`
    : `[${escapeLinkText(text)}](${escapeHref(href)})`;

const image = ({
  src,
  alt,
  title,
}: {
  src: string;
  alt?: string | null;
  title?: string | null;
}) => `!${linkedText({ text: alt ?? "", href: src, title })}`;

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
  linkTitle
    ? `[${image({ alt, src, title })}](${escapeHref(href)} ${escapeTitle(
        linkTitle,
      )})`
    : `[${image({ alt, src, title })}](${escapeHref(href)})`;

export const Markdown = {
  linkedText,
  image,
  linkedImage,
};

import type { ContextAttributes } from "./content";

export const getMarkdownForContext: (
  info: chrome.contextMenus.OnClickData & ContextAttributes,
  tab?: chrome.tabs.Tab,
) => string | null = (
  {
    menuItemId,
    linkUrl,
    mediaType,
    srcUrl,
    imageAlt,
    imageTitle,
    linkText,
    linkTitle,
  },
  tab,
) => {
  switch (menuItemId) {
    case "current-page":
      if (!tab?.url) return null;

      return linkedText({ text: tab.title ?? "Link", href: tab.url });

    case "link":
      if (!linkUrl) return null;

      switch (mediaType) {
        case "image":
          return srcUrl
            ? linkedImage({
                src: srcUrl,
                href: linkUrl,
                alt: imageAlt,
                title: imageTitle,
                linkTitle,
              })
            : null;
      }

      return linkedText({
        text: linkText ?? "Link",
        href: linkUrl,
        title: linkTitle,
      });

    case "image":
      return srcUrl
        ? image({ alt: imageAlt, src: srcUrl, title: imageTitle })
        : null;
  }

  throw new TypeError(`unknown context menu ID: ${menuItemId}`);
};
