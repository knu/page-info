import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "semantic-ui-css/semantic.min.css";
import { Popup } from "semantic-ui-react";
import { ImageLoader } from "./ImageLoader.tsx";
import { getPageInfo } from "./getPageInfo.ts";
import type { PageInfo } from "./getPageInfo.ts";
import { parseTemplate } from "url-template";
import type { Template } from "url-template";

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
      <i className="canonical-icon check square icon" />
    ) : canonicalUrl ? (
      <i className="noncanonical-icon external square alternate icon" />
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

type ShareProps = {
  url: string;
  title: string;
};

const ShareURLButton = ({ url, title }: ShareProps) => {
  const [shareIcon, setShareIcon] = useState<string | null>(null);
  const [shareURLTemplate, setShareURLTemplate] = useState<Template | null>(
    null,
  );

  useEffect(() => {
    chrome.storage.sync.get(
      {
        shareIcon: null,
        shareURLTemplate: null,
      },
      ({ shareIcon, shareURLTemplate }) => {
        setShareIcon(shareIcon);
        setShareURLTemplate(parseTemplate(shareURLTemplate));
      },
    );
  }, []);

  if (shareIcon === null || shareURLTemplate === null) return null;

  const handleClick = () => {
    const width = 450;
    const height = 600;

    window.open(
      shareURLTemplate.expand({ url, title }),
      "_blank",
      [
        `width=${width}`,
        `height=${height}`,
        "resizable=yes",
        "scrollbars=yes",
        "status=false",
        "location=false",
        "toolbar=false",
      ].join(","),
    );
  };

  return (
    <button
      className="fixed z-50 top-1 right-1 p-1 border-2 bg-white rounded"
      title="Share the page"
      onClick={handleClick}
    >
      <i className={`share-icon ${shareIcon} icon`} />
    </button>
  );
};

type SiteSummaryProps = {
  siteName: string | null | undefined;
  siteIcon: string | null | undefined;
  title: string | null | undefined;
  description: string | null | undefined;
};

const SiteSummary = ({
  siteName,
  siteIcon,
  title,
  description,
}: SiteSummaryProps) => (
  <>
    {siteName && (
      <div className="mb-2 px-2 pr-8 og-site-name">
        {siteIcon && (
          <ImageLoader
            src={siteIcon}
            title={siteName}
            className="og-icon"
            errorAttributes={{
              alt: "Image Not Found",
              title: "Image Not Found",
              className: "og-icon error",
            }}
            placeholderContent={<div className="og-icon placeholder" />}
          />
        )}
        <p className="text-base font-bold">{siteName}</p>
      </div>
    )}

    {title ? (
      <div className="px-2 pr-8 og-text">
        <h1 className="text-xl font-bold">{title}</h1>

        {description && <p className="mt-1 text-base">{description}</p>}
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
  </>
);

type SiteImageProps = {
  image: string | null | undefined;
  pageError: string | undefined;
};

const SiteImage = ({ image, pageError }: SiteImageProps) =>
  pageError ? (
    <div className="mt-2 p-4 rounded bg-amber-100 flex-middle error">
      <p className="space-y-2">
        The page information cannot be inspected because of the following error:
      </p>
      <p className="space-y-2 mx-4 text-red-600">{pageError}</p>
    </div>
  ) : !image ? (
    <div className="mt-2 rounded bg-light flex-middle no-og-image">
      No Image
    </div>
  ) : (
    <ImageLoader
      src={image}
      className="mt-2 rounded bg-light flex-middle og-image"
      errorAttributes={{
        alt: "Image Not Found",
        title: "Image Not Found",
        className: "mt-2 rounded bg-light flex-middle og-image error",
      }}
      placeholderContent={
        <div className="mt-2 rounded bg-light flex-middle og-image placeholder" />
      }
    />
  );

const PageInfoPopup = () => {
  const [pageInfo, setPageInfo] = useState<PageInfo | undefined>();
  const [pageError, setPageError] = useState<string | undefined>();

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

        chrome.scripting
          .executeScript({
            target: { tabId: tab.id },
            func: getPageInfo,
          })
          .then((results) => {
            for (const { result } of results) {
              setPageInfo(result);
            }
          })
          .catch((e) => {
            const message = `${e}`;
            const { url, title, favIconUrl: icon } = tab;

            if (url !== undefined) {
              setPageInfo({ url, title, icon });
              setPageError(message);
            } else {
              window.close();
            }
          });
      });
  }, []);

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

  const shareURL = canonicalUrl ?? url;
  const shareTitle = og_title ?? title;

  return (
    <div id="container" className="overflow-auto p-3">
      {shareURL && shareTitle && (
        <ShareURLButton url={shareURL} title={shareTitle} />
      )}
      <div className="pb-8">
        <SiteSummary
          siteName={og_site_name}
          siteIcon={icon}
          title={og_title ?? title}
          description={og_description ?? description}
        />
        <SiteImage image={og_image} pageError={pageError} />
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
