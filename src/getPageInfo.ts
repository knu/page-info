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
  const getElementAttribute = (
    selector: string,
    attribute: string,
    maxBy?: (element: Element) => any,
  ) => {
    const aSelector = `${selector}[${attribute}]`;

    const value = maxBy
      ? Array.from(document.querySelectorAll(aSelector))
        .map((element) => [maxBy(element), element.getAttribute(attribute)])
        .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))[0]?.[1]
      : document.querySelector(aSelector)?.getAttribute(attribute);

    if (!value) return null;

    const div = document.createElement("div");
    div.innerHTML = value;
    return div.textContent!;
  };

  const result: PageInfo = {
    url: window.location.href,
    canonicalUrl: getElementAttribute("link[rel='canonical']", "href"),
    icon: getElementAttribute(
      "link[rel='icon']",
      "href",
      (elem) =>
        elem
          .getAttribute("sizes")
          ?.split(/\D+/)
          .map((s) => parseInt(s))
          .filter((n) => !isNaN(n))
          .sort()
          .pop() ?? 0,
    ),
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
    og_image: getElementAttribute("meta[property='og:image']", "content"),
  };

  return result;
};
