import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import type { ReactNode } from "react";
import "semantic-ui-css/semantic.min.css";
import { Popup } from "semantic-ui-react";
import { ImageLoader } from "./ImageLoader.tsx";
import { getPageInfo } from "./getPageInfo.ts";
import type { PageInfo } from "./getPageInfo.ts";
import type { ShareURLMessage } from "./worker.ts";

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
    <div className="fixed z-50 bottom-1 left-1 p-0.5 border-2 border-gray-100 dark:border-gray-600 rounded max-w-[98%] whitespace-nowrap overflow-hidden truncate">
      {canonicalUrl && "Canonical "}
      {"URL: "}
      {emoji}
      <Popup
        trigger={
          <a
            href={pageUrl}
            target="_blank"
            rel="noreferrer"
            className="overflow-clip text-blue-600 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-400"
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
  const [shareURLTemplate, setShareURLTemplate] = useState<string | null>(null);

  useEffect(() => {
    chrome.storage.sync.get(
      {
        shareIcon: null,
      },
      ({ shareIcon, shareURLTemplate }) => {
        setShareIcon(shareIcon);
        setShareURLTemplate(shareURLTemplate);
      },
    );
  }, []);

  if (shareIcon === null || shareURLTemplate === null) return null;

  const handleClick = () => {
    const message: ShareURLMessage = {
      action: "shareURL",
      url,
      title,
    };

    chrome.runtime.sendMessage(message);
  };

  return (
    <button
      className="fixed z-50 top-1 right-1 p-1 border-2 border-gray-200 dark:border-gray-700 rounded"
      title="Share the page"
      onClick={handleClick}
    >
      <i className={`share-icon ${shareIcon} icon`} style={{ margin: 0 }} />
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
      <div className="mb-2 px-2 og-site-name">
        {siteIcon && (
          <ImageLoader
            src={siteIcon}
            title={siteName}
            className="og-icon"
            errorAttributes={{
              className: "og-icon error",
            }}
            placeholderContent={<div className="og-icon placeholder" />}
          />
        )}
        <p className="text-base font-bold">{siteName}</p>
      </div>
    )}

    {title ? (
      <div className="px-2 og-text">
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
  alt: string | null | undefined;
  pageError: string | undefined;
};

const ActiveTabClasses =
  "text-blue-600 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-400 border-blue-600 dark:border-blue-500";
const InactiveTabClasses =
  "text-gray-500 hover:text-gray-600 dark:text-gray-400 border-gray-100 hover:border-gray-300 dark:border-gray-700 dark:hover:text-gray-300";

const SiteImage = ({ image, alt, pageError }: SiteImageProps) =>
  pageError ? (
    <div className="mt-2 p-4 rounded bg-amber-100 dark:text-gray-600 flex-middle error">
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
      alt={alt ?? undefined}
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
    document.body.classList.add(
      "text-black",
      "dark:text-white",
      "bg-white",
      "dark:bg-gray-800",
    );

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

  const { url, canonicalUrl, title, description, icon, og, twitter } =
    pageInfo ?? {};

  const shareURL = canonicalUrl ?? url;
  const shareTitle = og?.title ?? title;

  type Panel = {
    id: string;
    name: string;
    render: () => ReactNode;
  };

  const panels: Panel[] = [
    {
      id: "og",
      name: "OGP",
      render: () => (
        <div>
          <SiteSummary
            siteName={og?.siteName}
            siteIcon={icon}
            title={og?.title ?? title}
            description={og?.description ?? description}
          />
          <SiteImage
            image={og?.image}
            alt={og?.imageAlt}
            pageError={pageError}
          />
        </div>
      ),
    },
  ];

  if (twitter !== undefined) {
    panels.push({
      id: "twitter",
      name: "Twitter",
      render: () => (
        <div>
          <SiteSummary
            siteName={og?.siteName}
            siteIcon={icon}
            title={twitter?.title ?? og?.title ?? title}
            description={twitter?.description ?? og?.description ?? description}
          />
          <SiteImage
            image={twitter?.image ?? og?.image}
            alt={twitter?.imageAlt ?? og?.imageAlt}
            pageError={pageError}
          />
        </div>
      ),
    });
  }

  const [selectedPanelID, setSelectedPanelID] = useState<string>("og");
  const showTabs = panels.length > 1;

  return (
    <div id="container" className="p-3">
      {shareURL && shareTitle && (
        <ShareURLButton url={shareURL} title={shareTitle} />
      )}
      {showTabs && (
        <div className="mb-2 border-b border-gray-200 dark:border-gray-700 pr-8">
          <ul
            className="flex flex-wrap -mb-px text-sm text-center"
            role="tablist"
          >
            {panels.map(({ id, name }) => (
              <li className="space-x-2" role="presentation">
                <button
                  className={`inline-block px-4 py-1 border-b-2 font-sans ${
                    id === selectedPanelID
                      ? ActiveTabClasses
                      : InactiveTabClasses
                  }`}
                  type="button"
                  role="tab"
                  aria-controls={id}
                  aria-selected={id === selectedPanelID ? "true" : "false"}
                  onClick={() => setSelectedPanelID(id)}
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div
        id="tab-content"
        className={`overflow-auto pb-10 ${showTabs ? "" : "pr-8"}`}
      >
        {panels.map(({ id, render }) => (
          <div
            className={id !== selectedPanelID ? "hidden" : ""}
            id={id}
            role="tabpanel"
            aria-labelledby={`${id}-tab`}
          >
            {render()}
          </div>
        ))}
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
