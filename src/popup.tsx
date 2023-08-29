import React, { useEffect, useState, Dispatch, SetStateAction } from "react";
import ReactDOM from "react-dom/client";
import { getPageInfo } from "./getPageInfo.ts";
import type { PageInfo } from "./getPageInfo.ts";

const Popup = () => {
  const [pageInfo, setPageInfo] = useState({} as PageInfo);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true })
      .then(([tab]) => {
        if (!tab || !tab.id) return;

        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: getPageInfo
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
