export type PageInfo = {
  url: string;
  canonicalUrl?: string | null;
  title?: string | null;
  description?: string | null;
  icon?: string | null;
  og_site_name?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image?: string | null;
};

export const getPageInfo: () => PageInfo = () => {
  const compareValues = (a: any, b: any) => (a < b ? 1 : a > b ? -1 : 0);
  const compareArrays = (a: any[], b: any[]) => {
    for (const [i, ai] of a.entries()) {
      const cmp = compareValues(ai, b[i]);
      if (cmp) return cmp;
    }
    return 0;
  };
  const compare = (a: any, b: any) =>
    Array.isArray(a) ? compareArrays(a, b) : compareValues(a, b);

  const getElementAttribute = (
    selector: string,
    attribute: string,
    maxBy?: (element: Element) => any,
  ) => {
    const aSelector = `${selector}[${attribute}]`;

    const value = maxBy
      ? Array.from(document.querySelectorAll(aSelector))
          .map((element) => [maxBy(element), element.getAttribute(attribute)])
          .sort(([a], [b]) => compare(a, b))[0]?.[1]
      : document.querySelector(aSelector)?.getAttribute(attribute);

    return value || null;
  };

  const url = window.location.href;
  const iconSortKey = (elem: Element) => {
    const rel = elem.getAttribute("rel");
    switch (rel) {
      case "icon":
        const size =
          elem
            .getAttribute("sizes")
            ?.split(/\D+/)
            .map((s) => parseInt(s))
            .filter((n) => !isNaN(n))
            .sort()
            .pop() ?? 0;

        return [3, size];
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
  const imageURL = ogImage && new URL(ogImage, url).toString();

  const result: PageInfo = {
    url,
    canonicalUrl: getElementAttribute("link[rel='canonical']", "href"),
    icon: iconURL,
    title: document.title,
    description: getElementAttribute("meta[name='description']", "content"),
    og_title: getElementAttribute("meta[property='og:title']", "content"),
    og_site_name: getElementAttribute(
      "meta[property='og:site_name']",
      "content",
    ),
    og_description: getElementAttribute(
      "meta[property='og:description']",
      "content",
    ),
    og_image: imageURL,
  };

  return result;
};
