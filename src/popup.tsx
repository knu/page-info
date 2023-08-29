import React, { useEffect, useState, Dispatch, SetStateAction } from "react";
import ReactDOM from "react-dom/client";

type PageInfo = {
  url: string;
  canonicalUrl?: string;
  title?: string;
  description?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
};

const obtainPageInfo: () => PageInfo = () => {
  const getElementAttribute = (selector: string, attribute: string) =>
    document.querySelector(`${selector}[${attribute}]`)
      ?.getAttribute(attribute) ?? undefined;

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

const Popup = () => {
  const [pageInfo, setPageInfo] = useState({} as PageInfo);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true })
      .then(([tab]) => {
        if (!tab || !tab.id) return;

        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: obtainPageInfo
        })
          .then((results) => {
            for (const { result } of results) {
              setPageInfo(result);
            }
          });
      })
  });

  const {
    url,
    canonicalUrl,
    title,
    description,
    og_title,
    og_description,
    og_image,
  } = pageInfo;

  return (
    <div className="App" style={{ width: 480, height: 480 }}>
      {og_image &&
        <img
          src={og_image}
          width="100%"
        />
      }

      {(og_title ?? title) &&
        <h1>{og_title ?? title}</h1>
      }

      {(og_description ?? description) &&
        <p>{og_description ?? description}</p>
      }

      {canonicalUrl &&
        <p>Canonical URL: {url === canonicalUrl ? "✅" :
          <>👉 <a href={canonicalUrl} target="_blank" rel="noreferrer">{canonicalUrl}</a></>
        }</p>
      }
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
