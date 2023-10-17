import React, { useEffect, useState, useCallback, useMemo } from "react";
import ReactDOM from "react-dom/client";
import type { ReactNode } from "react";
import Modal from "react-modal";
import "semantic-ui-css/semantic.min.css";
import { Popup } from "semantic-ui-react";
import Shortcuts from "shortcuts";
import type {
  Descriptor as ShortcutDescriptor,
  Handler as ShortcutHandler,
} from "shortcuts";
import { ImageLoader } from "./ImageLoader.tsx";
import { getPageInfo } from "./getPageInfo.ts";
import type { PageInfo } from "./getPageInfo.ts";
import { CopiableButton } from "./CopiableButton.tsx";
import { getMarkdownForContext } from "./Markdown.ts";
import { getHTMLForContext } from "./HTML.ts";
import { getActiveTabInfo, visitURL } from "./worker.ts";
import type { SaveURLMessage } from "./worker.ts";

const ShortcutCommands = [
  "visitCanonicalURL",
  "prevPanel",
  "nextPanel",
  "copyURL",
  "copyMarkdown",
  "saveURL",
  "help",
  "closeHelp",
] as const;
type ShortcutCommand = (typeof ShortcutCommands)[number];
const ShortcutDefinitions: {
  [name in ShortcutCommand]: {
    shortcut: string[];
    description?: string;
  };
} = {
  visitCanonicalURL: {
    shortcut: ["C"],
    description: "Visit the canonical URL",
  },
  prevPanel: {
    shortcut: ["Left", "H"],
    description: "Previous panel",
  },
  nextPanel: {
    shortcut: ["Right", "L"],
    description: "Next panel",
  },
  copyURL: {
    shortcut: ["CmdOrCtrl+C"],
    description: "Copy the canonical URL",
  },
  copyMarkdown: {
    shortcut: ["CmdOrCtrl+Shift+C"],
    description: "Copy a Markdown link",
  },
  saveURL: {
    shortcut: ["CmdOrCtrl+D"],
    description: "Save URL online",
  },
  help: {
    shortcut: ["?", "Shift+?"],
    description: "Show or hide this help",
  },
  closeHelp: {
    shortcut: ["Esc"],
  },
};
const isShortcutCommand = (name: string): name is ShortcutCommand =>
  name in ShortcutDefinitions;
const mustGetShortcutDefinition = (name: string) => {
  if (!isShortcutCommand(name)) throw `unknown command: ${name}`;
  return ShortcutDefinitions[name];
};
const generateShortcutKeyBindings = (mapping: {
  [key in ShortcutCommand]?: ShortcutHandler;
}) =>
  Object.entries(mapping).flatMap(([name, handler]): ShortcutDescriptor[] =>
    mustGetShortcutDefinition(name).shortcut.map((key) => ({
      shortcut: key,
      handler,
    })),
  );

const URLButton = ({ url, canonicalUrl, isCanonical }: PageInfo) => {
  const pageUrl = canonicalUrl ?? url;

  const emoji = isCanonical ? (
    <i className="canonical-icon check square icon" />
  ) : canonicalUrl ? (
    <i className="noncanonical-icon external square alternate icon" />
  ) : null;

  return (
    <div className="fixed z-40 bottom-1 left-1 p-0.5 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 rounded max-w-[98%] whitespace-nowrap overflow-hidden truncate">
      {canonicalUrl && "Canonical "}
      {"URL: "}
      {emoji}
      <CopiableButton
        className={`overflow-clip text-blue-600 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-400 ${
          url === pageUrl ? "" : "cursor-pointer"
        }`}
        title={pageUrl}
        copyText={pageUrl}
        shortcutKey={ShortcutDefinitions.copyURL.shortcut}
        hoverPopupContent={
          url === pageUrl
            ? "Click to copy the URL"
            : "Click to visit the canonical URL"
        }
        copiedPopupContent="Copied!"
        clickedPopupContent="Visiting..."
        onClick={
          url === pageUrl
            ? undefined
            : (e: React.MouseEvent) => {
                e.preventDefault();
                visitURL({ url: pageUrl });
              }
        }
        position="top left"
      >
        {pageUrl}
      </CopiableButton>
    </div>
  );
};

type SaveURLProps = {
  url: string;
  title: string;
};

const SaveURLButton = ({ url, title }: SaveURLProps) => {
  const [saveURLIcon, setSaveURLIcon] = useState<string | null>(null);
  const [saveURLTemplate, setSaveURLTemplate] = useState<string | null>(null);
  const [popupContent, setPopupContent] = useState<ReactNode | undefined>();
  const [timer, setTimer] = useState<number | undefined>();

  const popup = useCallback(
    (content?: ReactNode | undefined, timeout?: number) => {
      setPopupContent(content);
      clearTimeout(timer);
      if (timeout !== undefined) {
        setTimer(setTimeout(() => setPopupContent(undefined), timeout));
      }
    },
    [],
  );

  useEffect(() => {
    chrome.storage.sync.get(
      {
        saveURLIcon: null,
        saveURLTemplate: null,
      },
      ({ saveURLIcon, saveURLTemplate }) => {
        setSaveURLIcon(saveURLIcon);
        setSaveURLTemplate(saveURLTemplate);
      },
    );
  }, []);

  const handleHover = useCallback(() => {
    popup(
      <div>
        Click to save this URL online
        <blockquote className="mx-2 break-all">{url}</blockquote>
      </div>,
    );
  }, [url]);

  const doSaveURL = useCallback(() => {
    const message: SaveURLMessage = {
      action: "saveURL",
      url,
      title,
    };

    chrome.runtime
      .sendMessage(message)
      .then(({ ok }) => (ok ? window.close() : popup("Error!", 750)))
      .catch(() => popup("Error!", 750));

    return true;
  }, [url, title, popup]);

  useEffect(() => {
    const shortcuts = new Shortcuts({ capture: true });
    shortcuts.add(generateShortcutKeyBindings({ saveURL: doSaveURL }));
    shortcuts.start();

    return () => shortcuts.stop();
  }, [doSaveURL]);

  if (saveURLIcon === null || saveURLTemplate === null) return null;

  return (
    <Popup
      trigger={
        <button
          className="fixed z-40 top-1 right-1 p-1 border-2 border-gray-200 dark:border-gray-700 rounded"
          title="Save the URL online"
          onMouseEnter={handleHover}
          onMouseLeave={() => popup()}
          onClick={doSaveURL}
        >
          <i
            className={`save-url-icon ${saveURLIcon} icon`}
            style={{ margin: 0 }}
          />
        </button>
      }
      content={popupContent}
      on={[]}
      open={popupContent !== undefined}
      position="bottom left"
    />
  );
};

const OgText = ({
  url,
  title,
  description,
  selected,
}: {
  url: string;
  title: string;
  description: string | null | undefined;
  selected?: boolean;
}) => {
  const info: chrome.contextMenus.OnClickData = useMemo(
    () => ({
      menuItemId: "link",
      linkUrl: url,
      selectionText: title,
      editable: false,
      pageUrl: url,
    }),
    [url, title],
  );

  return (
    <div className="px-2 og-text">
      <h1 className="text-xl font-bold">
        <CopiableButton
          copyText={() => getMarkdownForContext(info)}
          copyHTML={() => getHTMLForContext(info)}
          shortcutKey={
            selected ? ShortcutDefinitions.copyMarkdown.shortcut : null
          }
          hoverPopupContent={
            <div>
              Click to copy a Markdown link to
              <blockquote className="mx-2 break-all">{url}</blockquote>
            </div>
          }
          copiedPopupContent="Copied!"
          position="top left"
        >
          <span
            title={url}
            className="text-black dark:text-white hover:text-black dark:hover:text-white"
          >
            {title}
          </span>
        </CopiableButton>
      </h1>

      {description && <p className="mt-1 text-base">{description}</p>}
    </div>
  );
};

type SiteSummaryProps = {
  siteName: string | null | undefined;
  siteIcon: string | null | undefined;
  title: string | null | undefined;
  url: string | null | undefined;
  description: string | null | undefined;
  selected?: boolean;
};

const SiteSummary = ({
  siteName,
  siteIcon,
  title,
  url,
  description,
  selected,
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

    {url && title ? (
      <OgText {...{ url, title, description, selected }} />
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
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [reloadCounter, setReloadCounter] = useState(0);
  const [pageInfo, setPageInfo] = useState<PageInfo | undefined>();
  const [pageError, setPageError] = useState<string | undefined>();

  useEffect(() => {
    document.body.classList.add(
      "text-black",
      "dark:text-white",
      "bg-white",
      "dark:bg-gray-800",
    );
  }, []);

  useEffect(() => {
    setPageInfo(undefined);
    setPageError(undefined);

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

    getActiveTabInfo()
      .then(({ id, url, title, favIconUrl: icon }) => {
        chrome.scripting
          .executeScript({
            target: { tabId: id },
            func: getPageInfo,
          })
          .then((results) => {
            for (const { result } of results) {
              setPageInfo(result);
            }
          })
          .catch((e) => {
            const message = `${e}`;

            if (url !== undefined) {
              setPageInfo({ url, title, icon });
              setPageError(message);
            } else {
              window.close();
            }
          });
      })
      .catch(() => window.close());
  }, [reloadCounter]);

  type Panel = {
    id: string;
    name: string;
    url: string | null | undefined;
    title: string | null | undefined;
    render: (props: {
      url: string | null | undefined;
      title: string | null | undefined;
      selected: boolean;
    }) => ReactNode;
  };

  const [panels, setPanels] = useState([] as Panel[]);

  useEffect(() => {
    const {
      url,
      canonicalUrl,
      isCanonical,
      title,
      description,
      icon,
      og,
      twitter,
    } = pageInfo ?? {};

    const panels: Panel[] = [
      {
        id: "og",
        name: "OGP",
        url: canonicalUrl ?? url,
        title: og?.title ?? title,
        render: ({ url, title, selected }) => (
          <div>
            <SiteSummary
              siteName={og?.siteName}
              siteIcon={icon}
              url={url}
              title={title}
              description={og?.description ?? description}
              selected={selected}
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
        url: canonicalUrl ?? url,
        title: twitter?.title ?? og?.title ?? title,
        render: ({ url, title, selected }) => (
          <div>
            <SiteSummary
              siteName={og?.siteName}
              siteIcon={icon}
              url={url}
              title={title}
              description={
                twitter?.description ?? og?.description ?? description
              }
              selected={selected}
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

    if (!isCanonical) {
      panels.push({
        id: "noncanonical",
        name: "Non-canonical",
        url: url,
        title: title,
        render: ({ url, title, selected }) => (
          <div>
            <SiteSummary
              siteName={og?.siteName}
              siteIcon={icon}
              url={url}
              title={title}
              description={description}
              selected={selected}
            />
            <SiteImage
              image={og?.image}
              alt={og?.imageAlt}
              pageError={pageError}
            />
          </div>
        ),
      });
    }

    setPanels(panels);
  }, [pageInfo]);

  const { url, canonicalUrl, isCanonical, publishedTime, modifiedTime } =
    pageInfo ?? {};

  const toDate = (str: string | null | undefined): Date | null => {
    if (!str) return null;

    try {
      const time = Date.parse(str);
      return Number.isNaN(time) ? null : new Date(time);
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
  const selectedPanel = panels.find(({ id }) => id === selectedPanelID);

  const visitCanonicalURL = useCallback(() => {
    if (canonicalUrl) visitURL({ url: canonicalUrl });
    return true;
  }, [canonicalUrl]);
  const nextPanel = useCallback(() => {
    const len = panels.length;
    if (len <= 1) return;
    const index = panels.findIndex(({ id }) => id === selectedPanelID);
    setSelectedPanelID(panels[(index + 1) % len].id);
    return true;
  }, [panels, selectedPanelID]);
  const prevPanel = useCallback(() => {
    const len = panels.length;
    if (len <= 1) return;
    const index = panels.findIndex(({ id }) => id === selectedPanelID);
    setSelectedPanelID(panels[(index - 1 + len) % len].id);
    return true;
  }, [panels, selectedPanelID]);

  useEffect(() => {
    const shortcuts = new Shortcuts({ capture: true });
    const help = () => {
      setIsHelpOpen(!isHelpOpen);
      return true;
    };
    const closeHelp = () => {
      if (!isHelpOpen) return false;
      setIsHelpOpen(false);
      return true;
    };
    shortcuts.add(
      generateShortcutKeyBindings({
        visitCanonicalURL,
        prevPanel,
        nextPanel,
        help,
        closeHelp,
      }),
    );
    shortcuts.start();

    return () => shortcuts.stop();
  }, [visitCanonicalURL, prevPanel, nextPanel, isHelpOpen]);

  if (!selectedPanel) return null;

  const { url: saveURL, title: saveTitle } = selectedPanel;
  const showTabs = panels.length > 1;
  const manifest = chrome.runtime.getManifest();
  const { homepage_url } = manifest;

  return (
    <div id="container" className="p-3">
      <Modal
        isOpen={isHelpOpen}
        onRequestClose={() => setIsHelpOpen(false)}
        className="help-modal absolute z-50 top-8 bottom-8 left-4 right-4 p-4 rounded outline-none text-gray-700 dark:text-white bg-gray-100 dark:bg-gray-700"
        overlayClassName="help-modal-overlay fixed z-50 top-0 bottom-0 left-0 right-0 bg-[rgba(0,0,0,0.4)]"
        contentLabel="Help"
      >
        <div className="help-modal-window w-full h-full relative">
          <div className="help-modal-content grid grid-cols-3 gap-1">
            <h1 className="col-span-3 text-2xl font-bold text-center">
              Shortcut Keys
            </h1>
            <ul className="col-span-3 text-sm">
              <li className="grid grid-cols-3 gap-1 leading-8">
                <div className="font-bold indent-2">Key</div>
                <div className="col-span-2 font-bold indent-2">Function</div>
              </li>
              {ShortcutCommands.map(mustGetShortcutDefinition).map(
                ({ shortcut, description }) =>
                  description && (
                    <li className="grid grid-cols-3 gap-1 leading-8">
                      <div>
                        {shortcut.map((key, i) => (
                          <>
                            {i > 0 && ", "}
                            <kbd className="mx-1 px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
                              {key}
                            </kbd>
                          </>
                        ))}
                      </div>
                      <div className="col-span-2">{description}</div>
                    </li>
                  ),
              )}
            </ul>
            <div className="absolute bottom-0 right-0">
              <button
                onClick={() => chrome.tabs.create({ url: homepage_url! })}
              >
                {manifest.name} {manifest.version}
              </button>
            </div>
          </div>
        </div>
      </Modal>
      {saveURL && saveTitle && (
        <SaveURLButton url={saveURL} title={saveTitle} />
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
        {panels.map(({ id, url, title, render }) => {
          const selected = id === selectedPanelID;

          return (
            <div
              className={selected ? undefined : "hidden"}
              id={id}
              role="tabpanel"
              aria-labelledby={`${id}-tab`}
            >
              {render({ url, title, selected: !isHelpOpen && selected })}
            </div>
          );
        })}
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
