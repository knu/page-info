export type PageInfo = {
  url: string;
  canonicalUrl?: string;
  title?: string;
  description?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
};

export const getPageInfo: () => PageInfo = () => {
  const getElementAttribute = (selector: string, attribute: string) => {
    const value = document
      .querySelector(`${selector}[${attribute}]`)
      ?.getAttribute(attribute);

    if (!value) return undefined;

    const div = document.createElement('div');
    div.innerHTML = value;
    return div.textContent!;
  };

  const result: PageInfo = {
    url: window.location.href,
    canonicalUrl: getElementAttribute("link[rel='canonical']", "href"),
    title: document.title,
    description: getElementAttribute("meta[name='description']", "content"),
    og_title: getElementAttribute("meta[property='og:title']", "content"),
    og_description: getElementAttribute("meta[property='og:description']", "content"),
    og_image: getElementAttribute("meta[property='og:image']", "content"),
  };

  return result;
};
