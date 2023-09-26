import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import type { ReactNode } from "react";
import "semantic-ui-css/semantic.min.css";
import { Popup } from "semantic-ui-react";
import { ImageLoader } from "./ImageLoader.tsx";
import { getPageInfo } from "./getPageInfo.ts";
import type { PageInfo } from "./getPageInfo.ts";
import { CopiableButton } from "./CopiableButton.tsx";
import { getMarkdownForContext } from "./Markdown.ts";
import type { ShareURLMessage } from "./worker.ts";

const URLButton = ({ url, canonicalUrl, isCanonical }: PageInfo) => {
  const pageUrl = canonicalUrl ?? url;

  const emoji = isCanonical ? (
    <i className="canonical-icon check square icon" />
  ) : canonicalUrl ? (
    <i className="noncanonical-icon external square alternate icon" />
  ) : null;

  return (
    <div className="fixed z-50 bottom-1 left-1 p-0.5 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 rounded max-w-[98%] whitespace-nowrap overflow-hidden truncate">
      {canonicalUrl && "Canonical "}
      {"URL: "}
      {emoji}
      {url === pageUrl ? (
        <CopiableButton
          className="overflow-clip text-blue-600 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-400"
          title={pageUrl}
          copyText={pageUrl}
          hoverPopupContent="Click to copy the URL"
          clickPopupContent="Copied!"
          position="top left"
        >
          {pageUrl}
        </CopiableButton>
      ) : (
        <Popup
          trigger={
            <a
              href={pageUrl}
              target="_blank"
              rel="noreferrer"
              className="overflow-clip text-blue-600 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-400"
              title={pageUrl}
              onClick={(e: React.MouseEvent<HTMLElement>) => {
                e.preventDefault();

                chrome.tabs
                  .query({
                    url: ["https://*/*", "http://*/*"],
                    active: true,
                    currentWindow: true,
                  })
                  .then(([tab]) => {
                    if (!tab?.id) return;

                    chrome.scripting.executeScript({
                      target: { tabId: tab.id },
                      func: ({ pageUrl }) => {
                        window.location.href = pageUrl;
                      },
                      args: [{ pageUrl }],
                    });
                  });
              }}
            >
              {pageUrl}
            </a>
          }
          content="Click to visit the canonical URL"
          position="top left"
          on="hover"
        />
      )}
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
  const [popupContent, setPopupContent] = useState<string | undefined>();
  const [timer, setTimer] = useState<number | undefined>();

  const popup = (message: string) => {
    setPopupContent(message);
    clearTimeout(timer);
    setTimer(setTimeout(() => setPopupContent(undefined), 750));
  };

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

    chrome.runtime
      .sendMessage(message)
      .then(({ ok }) => (ok ? popup("Sharing...") : popup("Error!")))
      .catch(() => popup("Error!"));
  };

  return (
    <Popup
      trigger={
        <button
          className="fixed z-50 top-1 right-1 p-1 border-2 border-gray-200 dark:border-gray-700 rounded"
          title="Share the page"
          onClick={handleClick}
        >
          <i className={`share-icon ${shareIcon} icon`} style={{ margin: 0 }} />
        </button>
      }
      content={popupContent}
      on={[]}
      open={popupContent !== undefined}
      position="bottom left"
    />
  );
};

type SiteSummaryProps = {
  siteName: string | null | undefined;
  siteIcon: string | null | undefined;
  title: string | null | undefined;
  url: string | null | undefined;
  description: string | null | undefined;
};

const SiteSummary = ({
  siteName,
  siteIcon,
  title,
  url,
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
        <h1 className="text-xl font-bold">
          <CopiableButton
            copyText={() =>
              getMarkdownForContext({
                menuItemId: "link",
                linkUrl: url ?? "",
                selectionText: title,
                editable: false,
                pageUrl: url ?? "",
              })
            }
            hoverPopupContent="Click to copy a Markdown link"
            clickPopupContent="Copied!"
            position="top left"
          >
            {title}
          </CopiableButton>
        </h1>

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
  const [reloadCounter, setReloadCounter] = useState(0);
  const [pageInfo, setPageInfo] = useState<PageInfo | undefined>();
  const [pageError, setPageError] = useState<string | undefined>();

  useEffect(() => {
    setPageInfo(undefined);
    setPageError(undefined);

    document.body.classList.add(
      "text-black",
      "dark:text-white",
      "bg-white",
      "dark:bg-gray-800",
    );

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      switch (message.action) {
        case "copyToClipboard":
          window.focus();
          navigator.clipboard
            .writeText(message.text)
            .then(() => {
              sendResponse({ ok: true });
            })
            .catch((error) => {
              sendResponse({ ok: false, error });
            });
          return true;
        case "updatePopup":
          setReloadCounter(reloadCounter + 1);
          return true;
      }
      return false;
    });

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
  }, [reloadCounter]);

  const {
    url,
    canonicalUrl,
    isCanonical,
    title,
    description,
    icon,
    publishedTime,
    modifiedTime,
    og,
    twitter,
  } = pageInfo ?? {};

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
            url={shareURL}
            title={shareTitle}
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
            url={shareURL}
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

  const toDate = (str: string | null | undefined): Date | null => {
    if (!str) return null;

    try {
      return new Date(Date.parse(str));
    } catch (e) {
      return null;
    }
  };
  const publishedAt = toDate(publishedTime);
  const modifiedAt = toDate(modifiedTime);
  const timeItems: ReactNode[] = [];

  if (publishedAt) {
    timeItems.push(
      <span>
        {"Published at "}
        <time dateTime={publishedAt.toISOString()}>
          {publishedAt.toLocaleString()}
        </time>
      </span>,
    );
  }
  if (modifiedAt) {
    timeItems.push(
      <span>
        {"Modified at "}
        <time dateTime={modifiedAt.toISOString()}>
          {modifiedAt.toLocaleString()}
        </time>
      </span>,
    );
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
        className={`overflow-auto ${showTabs ? "" : "pr-8"}`}
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

      <div className="mt-1 pb-10">
        <ul className="text-xs">
          {timeItems.map((item, i) => (
            <>
              <li
                key={i}
                className={`inline-block ${
                  i === 0
                    ? ""
                    : "ml-2 pl-2 border-l border-gray-200 dark:border-gray-600"
                }`}
              >
                {item}
              </li>
            </>
          ))}
        </ul>
      </div>

      {url && <URLButton {...{ url, canonicalUrl, isCanonical }} />}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <PageInfoPopup />
  </React.StrictMode>,
);
