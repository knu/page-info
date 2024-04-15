type PageOgInfo = {
  siteName?: string | null;
  title?: string | null;
  description?: string | null;
  image?: string | null;
  imageAlt?: string | null;
};

type PageTwitterInfo = {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  imageAlt?: string | null;
};

export type PageInfo = {
  url: string;
  canonicalUrl?: string | null;
  isCanonical?: boolean | null;
  title?: string | null;
  description?: string | null;
  icon?: string | null;
  publishedTime?: string | null;
  modifiedTime?: string | null;
  og?: PageOgInfo;
  twitter?: PageTwitterInfo;
};

export const getPageInfo: () => PageInfo = () => {
  const compareValues = <T>(a: T, b: T) => (a < b ? 1 : a > b ? -1 : 0);
  const compareArrays = <T extends object[]>(a: T, b: T) => {
    for (const [i, ai] of a.entries()) {
      const cmp = compareValues(ai, b[i]);
      if (cmp) return cmp;
    }
    return 0;
  };
  const compare = <T>(a: T, b: T) =>
    Array.isArray(a) && Array.isArray(b)
      ? compareArrays(a, b)
      : compareValues(a, b);
  const objectPresence = <T extends Record<string, unknown>>(
    object: T,
  ): T | undefined =>
    Object.values(object).some((value) => value != null) ? object : undefined;

  const getElementAttribute = (
    selector: string,
    attribute: string,
    maxBy?: (element: Element) => object,
  ) => {
    const aSelector = `${selector}[${attribute}]`;

    const value = maxBy
      ? Array.from(document.querySelectorAll(aSelector))
          .map((element): [object, string | null] => [
            maxBy(element),
            element.getAttribute(attribute),
          ])
          .sort(([a], [b]) => compare(a, b))[0]?.[1]
      : document.querySelector(aSelector)?.getAttribute(attribute);

    return value || null;
  };

  const normalizeUrl = (url: string | null) => {
    if (typeof url !== "string") return null;

    try {
      return new URL(url).toString();
    } catch (e) {
      return null;
    }
  };
  const url = window.location.href;
  const canonicalUrl = getElementAttribute("link[rel='canonical']", "href");
  const isCanonical =
    url === canonicalUrl || normalizeUrl(url) === normalizeUrl(canonicalUrl);
  const iconSortKey = (elem: Element) => {
    const rel = elem.getAttribute("rel");
    switch (rel) {
      case "icon": {
        const size =
          elem
            .getAttribute("sizes")
            ?.split(/\D+/)
            .map((s) => parseInt(s))
            .filter((n) => !isNaN(n))
            .sort()
            .pop() ?? 0;

        return [3, size];
      }
      case "shortcut icon":
        return [2, 0];
      case "apple-touch-icon":
        return [1, 0];
    }

    return [0, 0];
  };
  const icon = getElementAttribute(
    "link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']",
    "href",
    iconSortKey,
  );
  const iconURL = icon && new URL(icon, url).toString();

  const ogImage = getElementAttribute("meta[property='og:image']", "content");
  const ogImageURL = ogImage && new URL(ogImage, url).toString();

  const og = objectPresence({
    title: getElementAttribute("meta[property='og:title']", "content"),
    siteName: getElementAttribute("meta[property='og:site_name']", "content"),
    description: getElementAttribute(
      "meta[property='og:description']",
      "content",
    ),
    image: ogImageURL,
    imageAlt: getElementAttribute("meta[property='og:image:alt']", "content"),
  });

  const twitterImage = getElementAttribute(
    "meta[name='twitter:image']",
    "content",
  );
  const twitterImageURL = twitterImage && new URL(twitterImage, url).toString();

  const twitter = objectPresence({
    title: getElementAttribute("meta[name='twitter:title']", "content"),
    description: getElementAttribute(
      "meta[name='twitter:description']",
      "content",
    ),
    image: twitterImageURL,
    imageAlt: getElementAttribute("meta[name='twitter:image:alt']", "content"),
  });

  const result: PageInfo = {
    url,
    canonicalUrl,
    isCanonical,
    icon: iconURL,
    title: document.title || "",
    description: getElementAttribute("meta[name='description']", "content"),
    publishedTime: getElementAttribute(
      "meta[property='article:published_time']",
      "content",
    ),
    modifiedTime: getElementAttribute(
      "meta[property='article:modified_time']",
      "content",
    ),
    og,
    twitter,
  };

  return result;
};
