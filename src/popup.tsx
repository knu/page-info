import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "semantic-ui-css/semantic.min.css";
import { Popup } from "semantic-ui-react";
import { getPageInfo } from "./getPageInfo.ts";
import type { PageInfo } from "./getPageInfo.ts";

const UrlButton = ({ url, canonicalUrl }: PageInfo) => {
  const pageUrl = canonicalUrl ?? url;
  const isCopiable = url === pageUrl;
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [timer, setTimer] = useState<number | undefined>();

  const handleClose = () => {
    setIsOpen(false);
    setIsCopied(false);
    clearTimeout(timer);
  };

  const handleHover = () => {
    setIsOpen(true);
    setIsCopied(false);
    clearTimeout(timer);
    setTimer(
      setTimeout(() => {
        setIsOpen(false);
      }, 1500)
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setIsOpen(true);
      setIsCopied(true);
      clearTimeout(timer);
      setTimer(
        setTimeout(() => {
          setIsOpen(false);
          setIsCopied(false);
        }, 750)
      );
    });
  };

  const urlClickHandler =
    (url: string) => (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();

      if (!url) return;

      chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
        if (!tab?.id) return;

        if (isCopiable) {
          handleCopy();
        } else {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: ({ url }) => {
              window.location.href = url;
            },
            args: [{ url }],
          });
        }
      });
    };

  const emoji =
    url === canonicalUrl ? (
      <span>✅ </span>
    ) : canonicalUrl ? (
      <span>👉</span>
    ) : null;

  const popupContent =
    isCopied ? "Copied!" :
      isCopiable ? "Click to copy the URL" :
        "Click to visit the canonical URL";

  return (
    <div className="fixed z-50 bottom-1 left-1 p-1 border-2 bg-white rounded max-w-[98%] whitespace-nowrap overflow-hidden truncate">
      {canonicalUrl && "Canonical "}
      {"URL: "}
      {emoji}
      <Popup
        trigger={
          <a
            href={pageUrl}
            target="_blank"
            rel="noreferrer"
            className="overflow-clip"
            title={pageUrl}
            onClick={urlClickHandler(pageUrl)}
            onMouseEnter={handleHover}
          >
            {pageUrl}
          </a>
        }
        content={popupContent}
        position="top left"
        on={[]}
        open={isOpen}
        onClose={handleClose}
      />
    </div>
  );
};

const PageInfoPopup = () => {
  const [pageInfo, setPageInfo] = useState<PageInfo | undefined>();
  const [imgSrc, setImgSrc] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (!tab?.id) return;

      chrome.scripting
        .executeScript({
          target: { tabId: tab.id },
          func: getPageInfo,
        })
        .then((results) => {
          for (const { result } of results) {
            setPageInfo(result);
          }
        });
    });
  });

  const {
    url,
    canonicalUrl,
    title,
    description,
    og_title,
    og_description,
    og_image,
  } = pageInfo ?? {};

  useEffect(() => {
    if (og_image) {
      const img = new Image();
      img.src = og_image;
      img.onload = () => {
        setIsLoading(false);
        setImgSrc(og_image);
      };
      img.onerror = () => {
        setIsLoading(false);
        setIsError(true);
        setImgSrc(og_image);
      };
    } else if (og_image === null) {
      setIsLoading(false);
    }
  });

  return (
    <div className="App" style={{ width: 480, height: 480 }}>
      <div className="p-3 overflow-auto">
        {imgSrc ? (
          isError ? (
            <img src={"foo"} title="Image Not Found" className="rounded bg-light flex-middle og-image error" />
          ) : (
            <img src={imgSrc} className="rounded bg-light flex-middle og-image" />
          )
        ) : isLoading ? (
          <div className="rounded bl-light flex-middle placeholder og-image" />
        ) : (
          <div className="rounded bl-light flex-middle no-og-image">
            No Image
          </div>
        )}

        {og_title ?? title ? (
          <div className="mt-2 px-2 og-text">
            <h1 className="text-xl font-bold">{og_title ?? title}</h1>

            {(og_description ?? description) && (
              <p className="mt-1 text-base">{og_description ?? description}</p>
            )}
          </div>
        ) : (
          <div className="mt-2 px-2 placeholder og-text">
            <div className="dummy-line" />
            <div className="dummy-line" />
            <div className="dummy-line" />
            <div className="dummy-line" />
            <div className="dummy-line" />
          </div>
        )}

        {url && <UrlButton {...{ url, canonicalUrl }} />}
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <PageInfoPopup />
  </React.StrictMode>,
);
