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

const linkedText = ({ text, href }: { text: string; href: string }) =>
  `[${escapeLinkText(text)}](${escapeHref(href)})`;

const image = ({ alt = "", src }: { alt?: string; src: string }) =>
  `![${escapeLinkText(alt)}](${escapeHref(src)})`;

const linkedImage = ({
  alt,
  src,
  href,
}: {
  alt?: string;
  src: string;
  href: string;
}) => `[${image({ alt, src })}](${escapeHref(href)})`;

export const Markdown = {
  linkedText,
  image,
  linkedImage,
};

export const getMarkdownForContext: (
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab,
) => string | null = (
  { menuItemId, linkUrl, mediaType, srcUrl, selectionText },
  tab,
) => {
  switch (menuItemId) {
    case "current-page":
      if (!tab?.url) return null;

      return Markdown.linkedText({ text: tab.title ?? "Link", href: tab.url });

    case "link":
      if (!linkUrl) return null;

      switch (mediaType) {
        case "image":
          return srcUrl
            ? Markdown.linkedImage({
                src: srcUrl,
                href: linkUrl,
              })
            : null;
      }

      return Markdown.linkedText({
        text: selectionText ?? "Link",
        href: linkUrl,
      });

    case "image":
      return srcUrl
        ? Markdown.image({ alt: selectionText, src: srcUrl })
        : null;
  }

  throw new TypeError(`unknown context menu ID: ${menuItemId}`);
};
