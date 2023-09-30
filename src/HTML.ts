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
  attributes: Record<string, string | undefined>,
  innerHTML?: string,
) => {
  const t = [
    tagName,
    ...Object.entries(attributes).map(([key, value]) =>
      value === undefined ? [] : escapeAttribute(key, value),
    ),
  ].join(" ");

  return innerHTML === undefined
    ? `<${t} />`
    : `<${t}>${innerHTML}</${tagName}>`;
};

const linkedText = ({ text, href }: { text: string; href: string }) =>
  elementHTML("a", { href }, escapeText(text));

const image = ({ alt = "", src }: { alt?: string; src: string }) =>
  elementHTML("img", { alt, src });

const linkedImage = ({
  alt,
  src,
  href,
}: {
  alt?: string;
  src: string;
  href: string;
}) => elementHTML("a", { href }, elementHTML("img", { alt, src }));

export const HTML = {
  linkedText,
  image,
  linkedImage,
};

export const getHTMLForContext: (
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab,
) => string | null = (
  { menuItemId, linkUrl, mediaType, srcUrl, selectionText },
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
          // An image element as a clipboard item is not really useful
          return null;
      }

      return linkedText({
        text: selectionText ?? "Link",
        href: linkUrl,
      });

    case "image":
      // An image element as a clipboard item is not really useful
      return null;
  }

  throw new TypeError(`unknown context menu ID: ${menuItemId}`);
};
