import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "semantic-ui-css/semantic.min.css";
import { Popup } from "semantic-ui-react";
import { ImageLoader } from "./ImageLoader.tsx";
import { getPageInfo } from "./getPageInfo.ts";
import type { PageInfo } from "./getPageInfo.ts";

const URLButton = ({ url, canonicalUrl }: PageInfo) => {
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
        }, 750),
      );
    });
  };

  const urlClickHandler =
    (url: string) => (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();

      if (!url) return;

      chrome.tabs
        .query({
          url: ["https://*/*", "http://*/*"],
          active: true,
          currentWindow: true,
        })
        .then(([tab]) => {
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

  const popupContent = isCopied
    ? "Copied!"
    : isCopiable
    ? "Click to copy the URL"
    : "Click to visit the canonical URL";

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
            onMouseLeave={handleClose}
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

  useEffect(() => {
    chrome.tabs
      .query({
        url: ["https://*/*", "http://*/*"],
        active: true,
        currentWindow: true,
      })
      .then(([tab]) => {
        if (!tab?.id) {
          window.close();
          return;
        }

        try {
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
        } catch (e) {
          if (/cannot be scripted/.test(`${e}`)) {
            window.close();
          } else {
            throw e;
          }
        }
      });
  });

  const {
    url,
    canonicalUrl,
    title,
    description,
    icon,
    og_site_name,
    og_title,
    og_description,
    og_image,
  } = pageInfo ?? {};

  return (
    <div id="container" className="overflow-auto p-3">
      <div className="pb-8">
        {og_site_name && (
          <div className="mb-2 px-2 og-site-name">
            {icon && (
              <ImageLoader
                src={icon}
                title={og_site_name}
                className="og-icon"
                errorAttributes={{
                  alt: "Image Not Found",
                  title: "Image Not Found",
                  className: "og-icon error",
                }}
                placeholderContent={<div className="og-icon placeholder" />}
              />
            )}
            <p className="text-base font-bold">{og_site_name}</p>
          </div>
        )}

        {og_title ?? title ? (
          <div className="px-2 og-text">
            <h1 className="text-xl font-bold">{og_title ?? title}</h1>

            {(og_description ?? description) && (
              <p className="mt-1 text-base">{og_description ?? description}</p>
            )}
          </div>
        ) : (
          <div className="px-2 placeholder og-text">
            <div className="dummy-line" />
            <div className="dummy-line" />
            <div className="dummy-line" />
            <div className="dummy-line" />
            <div className="dummy-line" />
          </div>
        )}

        {og_image ? (
          <ImageLoader
            src={og_image}
            className="mt-2 rounded bg-light flex-middle og-image"
            errorAttributes={{
              alt: "Image Not Found",
              title: "Image Not Found",
              className: "mt-2 rounded bg-light flex-middle og-image error",
            }}
            placeholderContent={
              <div className="mt-2 rounded bl-light flex-middle og-image placeholder" />
            }
          />
        ) : (
          <div className="mt-2 rounded bl-light flex-middle no-og-image">
            No Image
          </div>
        )}
      </div>
      {url && <URLButton {...{ url, canonicalUrl }} />}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <PageInfoPopup />
  </React.StrictMode>,
);
