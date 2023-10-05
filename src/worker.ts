import { getPageInfo } from "./getPageInfo.ts";
import type { PageInfo } from "./getPageInfo.ts";
import { parseTemplate } from "url-template";
import type { Template } from "url-template";
import { getMarkdownForContext } from "./Markdown.ts";
import { getHTMLForContext } from "./HTML.ts";
import icon16Path from "./images/icon16.png";
import icon32Path from "./images/icon32.png";
import icon48Path from "./images/icon48.png";
import icon128Path from "./images/icon128.png";
import iconCanonical16Path from "./images/icon_canonical16.png";
import iconCanonical32Path from "./images/icon_canonical32.png";
import iconCanonical48Path from "./images/icon_canonical48.png";
import iconCanonical128Path from "./images/icon_canonical128.png";
import iconNoncanonical16Path from "./images/icon_noncanonical16.png";
import iconNoncanonical32Path from "./images/icon_noncanonical32.png";
import iconNoncanonical48Path from "./images/icon_noncanonical48.png";
import iconNoncanonical128Path from "./images/icon_noncanonical128.png";
import { writeViaNavigator } from "./clipboard.ts";

const safeAsync = <T, E>(
  promise: Promise<T>,
  onErrorResolve: (e: any) => E,
): Promise<T | E> =>
  new Promise<T | E>((resolve, _reject) =>
    promise.then(resolve).catch((e) => resolve(onErrorResolve(e))),
  );

type TabInfo = {
  id: number;
  url?: string;
  title?: string;
};

const getActiveTabInfo = async (): Promise<TabInfo> => {
  const [{ id = undefined, url = undefined, title = undefined } = {}] =
    await chrome.tabs.query({
      url: ["https://*/*", "http://*/*"],
      active: true,
      currentWindow: true,
    });
  if (!id) throw new Error("null tab id");
  return { id, url, title };
};

// Canonical URL detection

const TabPageInfo = new Map<number, PageInfo>();

const fetchTabPageInfo = async (
  tabId: number,
  force?: boolean,
): Promise<PageInfo> => {
  if (!force) {
    const pageInfo = TabPageInfo.get(tabId);
    if (pageInfo) return pageInfo;
  }

  const { url } = await safeAsync(chrome.tabs.get(tabId), (_e) => ({
    url: undefined,
  }));
  if (!url || !/^https?:\/\//.test(url)) return { url: url ?? "" };

  try {
    const [{ result: pageInfo }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: getPageInfo,
    });

    TabPageInfo.set(tabId, pageInfo);
    return pageInfo;
  } catch (e) {
    if (!/cannot be scripted|was removed/.test(`${e}`)) {
      console.error(e);
    }
    return { url };
  }
};

const clearTabPageInfo = (tabId: number) => {
  TabPageInfo.delete(tabId);
};

const defaultTitle = chrome.runtime.getManifest().action
  .default_title as string;

const normalIcon = {
  "16": icon16Path,
  "32": icon32Path,
  "48": icon48Path,
  "128": icon128Path,
};
const canonicalIcon = {
  "16": iconCanonical16Path,
  "32": iconCanonical32Path,
  "48": iconCanonical48Path,
  "128": iconCanonical128Path,
};
const noncanonicalIcon = {
  "16": iconNoncanonical16Path,
  "32": iconNoncanonical32Path,
  "48": iconNoncanonical48Path,
  "128": iconNoncanonical128Path,
};

const showCanonicalState = ({ isCanonical, canonicalUrl }: PageInfo) => {
  if (isCanonical) {
    chrome.action.setIcon({ path: canonicalIcon });
    chrome.action.setTitle({
      title: `${defaultTitle} - This URL is canonical.︎︎`,
    });
  } else if (canonicalUrl) {
    chrome.action.setIcon({ path: noncanonicalIcon });
    chrome.action.setTitle({
      title: `${defaultTitle} - There is a canonical URL for this page︎︎.`,
    });
  } else {
    chrome.action.setIcon({ path: normalIcon });
    chrome.action.setTitle({ title: defaultTitle });
  }
};

chrome.tabs.onActivated.addListener(({ tabId }) => {
  if (saveURLTabs.has(tabId)) return;
  fetchTabPageInfo(tabId).then(showCanonicalState);
});

chrome.tabs.onUpdated.addListener((tabId, { url }, tab) => {
  if (saveURLTabs.has(tabId)) return;
  if (url) {
    fetchTabPageInfo(tabId, true).then(showCanonicalState);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (saveURLTabs.has(tabId)) return;
  clearTabPageInfo(tabId);
});

chrome.webNavigation.onCompleted.addListener(({ frameId, tabId }) => {
  if (frameId !== 0 || tabId == null) return;
  if (saveURLTabs.has(tabId)) return;

  fetchTabPageInfo(tabId, true).then(showCanonicalState);

  chrome.runtime
    .sendMessage({ action: "updatePopup" })
    .then(() => {})
    .catch(() => {});
});

// Context menu

const showBadge = ({
  text,
  color = [0x7f, 0, 0, 0xff],
}: {
  text: string;
  color?: string | chrome.action.ColorArray;
}) => {
  chrome.action.setBadgeBackgroundColor({ color });
  chrome.action.setBadgeText({ text });
};

const showSuccessBadge = () => {
  showBadge({ text: "✓", color: "#00ff00" });
  chrome.alarms.create("clearBadge", { when: Date.now() + 500 });
};

const showFailureBadge = () => {
  showBadge({ text: "×", color: "#ff0000" });
  chrome.alarms.create("clearBadge", { when: Date.now() + 500 });
};

chrome.alarms.onAlarm.addListener(({ name }) => {
  switch (name) {
    case "clearBadge":
      showBadge({ text: "" });
      break;
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const tabId = tab?.id;
  if (!tabId) return;

  if (tab.url?.startsWith(`chrome-extension://${chrome.runtime.id}/`)) {
    if (info.menuItemId === "current-page") {
      commandCopyMarkdownLink();
    } else {
      const text = getMarkdownForContext(info, tab);
      if (!text) return;
      const html = getHTMLForContext(info, tab);

      chrome.runtime
        .sendMessage({ action: "copyToClipboard", text, html })
        .then(({ ok }) => (ok ? showSuccessBadge() : showFailureBadge()))
        .catch(() => showFailureBadge());
    }
  } else {
    const text = getMarkdownForContext(info, tab);
    if (!text) return;
    const html = getHTMLForContext(info, tab);

    chrome.scripting
      .executeScript({
        target: { tabId },
        func: writeViaNavigator,
        args: [{ text, html }],
      })
      .then(() => showSuccessBadge())
      .catch(() => showFailureBadge());
  }
});

chrome.runtime.onInstalled.addListener(() => {
  // Migration
  chrome.storage.sync
    .get({
      shareIcon: undefined,
      shareURLTemplate: undefined,
      shareURLInBackground: undefined,
    })
    .then(({ shareIcon, shareURLTemplate, shareURLInBackground }) => {
      if (
        shareIcon !== undefined ||
        shareURLTemplate !== undefined ||
        shareURLInBackground !== undefined
      ) {
        chrome.storage.sync
          .set({
            saveURLIcon: shareIcon,
            saveURLTemplate: shareURLTemplate,
            saveURLInBackground: shareURLInBackground,
          })
          .then(() => {
            chrome.storage.sync.remove([
              "shareIcon",
              "shareURLTemplate",
              "shareURLInBackground",
            ]);
          });
      }
    });

  const items: chrome.contextMenus.CreateProperties[] = [
    {
      id: "current-page",
      title: "Copy a Markdown link to the current page",
      contexts: ["page"],
    },
    {
      id: "link",
      title: "Copy a Markdown link",
      contexts: ["link"],
    },
    {
      id: "image",
      title: "Copy a Markdown image",
      contexts: ["image"],
    },
  ];

  items.forEach((item) =>
    chrome.contextMenus.create({
      documentUrlPatterns: [
        "http://*/*",
        "https://*/*",
        `chrome-extension://${chrome.runtime.id}/*`,
      ],
      ...item,
    }),
  );
});

// visit URL in the current tab

export type VisitURLMessage = {
  action: "visitURL";
  url: string;
};

const visitURL = (url: string) => {
  getActiveTabInfo()
    .then(({ id }) => {
      chrome.scripting
        .executeScript({
          target: { tabId: id },
          func: ({ url }) => {
            window.open(url, "_self", "noreferrer,noopener");
          },
          args: [{ url }],
        })
        .then(() => showSuccessBadge())
        .catch(() => showFailureBadge());
    })
    .catch(() => showFailureBadge());
};

const handleVisitURLMessage = (
  message: VisitURLMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void,
): boolean => {
  const { url } = message;
  visitURL(url);
  return false;
};

// Background URL saving

export type SaveURLMessage = {
  action: "saveURL";
  url: string;
  title: string;
};

const saveURLTabs = new Set<number>();

const handleSaveURLMessage = (
  message: SaveURLMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void,
): boolean => {
  const { url, title } = message;
  chrome.storage.sync
    .get({
      saveURLTemplate: null,
      saveURLInBackground: false,
    })
    .then(({ saveURLTemplate, saveURLInBackground }) => {
      if (typeof saveURLTemplate !== "string") return;

      const saveURL = parseTemplate(saveURLTemplate).expand({ url, title });
      const width = 450;
      const height = 600;

      chrome.windows
        .create({
          url: saveURL,
          type: "popup",
          focused: !saveURLInBackground,
          width,
          height,
        })
        .then(({ tabs }) => {
          tabs?.forEach(({ id }) => id && saveURLTabs.add(id));
          sendResponse({ ok: true });
        })
        .catch((e) => sendResponse({ ok: false }));
    });

  return true;
};

const getSaveURLPageScript = (url: string): (() => Promise<string>) | null => {
  switch (new URL(url).host) {
    case "app.raindrop.io":
      return () =>
        new Promise((resolve) => {
          const url = new URL(window.location.href);
          const timer = setInterval(() => {
            if (document.readyState === "complete" && !document.hasFocus()) {
              if (
                /Bookmark saved/.test(document.title) &&
                Array.from(document.querySelectorAll("*[role='button']")).some(
                  (e) => e.textContent === "Remove",
                )
              ) {
                clearInterval(timer);
                resolve("done");
              }
            }
          }, 250);
        });
    case "pinboard.in":
      return () =>
        new Promise((resolve) => {
          const url = new URL(window.location.href);
          const timer = setInterval(() => {
            if (document.readyState === "complete" && !document.hasFocus()) {
              if (url.hostname === "pinboard.in" && url.pathname === "/add") {
                if (url.search === "") {
                  clearInterval(timer);
                  resolve("done");
                } else {
                  const button = document.querySelector<HTMLInputElement>(
                    "form input[type='submit']",
                  );
                  if (button) {
                    clearInterval(timer);
                    button.click();
                  }
                }
              }
            }
          }, 250);
        });
    case "getpocket.com":
      return () =>
        new Promise((resolve) => {
          const url = new URL(window.location.href);
          const timer = setInterval(() => {
            if (document.readyState === "complete" && !document.hasFocus()) {
              if (document.querySelector(".removeitem")) {
                clearInterval(timer);
                resolve("done");
              }
            }
          }, 250);
        });
    default:
      return null;
  }
};

chrome.webNavigation.onCompleted.addListener(async ({ frameId, tabId }) => {
  if (frameId !== 0 || tabId == null) return;
  if (!saveURLTabs.has(tabId)) return;

  const { saveURLInBackground } = await chrome.storage.sync.get({
    saveURLInBackground: false,
  });
  if (!saveURLInBackground) return;

  const { url } = await chrome.tabs.get(tabId);
  if (!url || !/^https?:\/\//.test(url)) return;

  const func = getSaveURLPageScript(url);
  if (!func) return;

  chrome.scripting
    .executeScript({
      target: { tabId },
      func,
    })
    .then(([{ result }]) => {
      if (result === "done") chrome.tabs.remove(tabId);
      showSuccessBadge();
    })
    .catch(() => showFailureBadge());
});

chrome.tabs.onRemoved.addListener((tabId) => {
  saveURLTabs.delete(tabId);
});

// Message listener for the above

type MessageListener = (
  message: VisitURLMessage | SaveURLMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void,
) => boolean;

const messageListener: MessageListener = (message, sender, sendResponse) => {
  const { action } = message;

  switch (action) {
    case "visitURL":
      return handleVisitURLMessage(message, sender, sendResponse);
    case "saveURL":
      return handleSaveURLMessage(message, sender, sendResponse);
  }

  return false;
};

chrome.runtime.onMessage.addListener(messageListener);

export { getSaveURLPageScript };

// Commands

const commandVisitCanonicalURL = () => {
  getActiveTabInfo()
    .then(({ id }) => {
      fetchTabPageInfo(id)
        .then(({ canonicalUrl }) => {
          if (canonicalUrl) {
            visitURL(canonicalUrl);
            showSuccessBadge();
          } else {
            showFailureBadge();
          }
        })
        .catch(() => showFailureBadge());
    })
    .catch(() => showFailureBadge());
};

const commandCopyMarkdownLink = () => {
  getActiveTabInfo()
    .then(({ id: tabId, url, title = "Link" }) => {
      if (url === undefined) {
        showFailureBadge();
        return;
      }

      const info: chrome.contextMenus.OnClickData = {
        menuItemId: "link",
        linkUrl: url,
        selectionText: title,
        editable: false,
        pageUrl: url,
      };

      const text = getMarkdownForContext(info);
      if (text === null) {
        showFailureBadge();
        return;
      }
      const html = getHTMLForContext(info);

      chrome.tabs
        .sendMessage(tabId, { action: "copyToClipboard", text, html })
        .then(({ ok }) => (ok ? showSuccessBadge() : showFailureBadge()))
        .catch(() => showFailureBadge());
    })
    .catch(() => showFailureBadge());
};

chrome.commands.onCommand.addListener((command) => {
  switch (command) {
    case "visitCanonicalURL":
      commandVisitCanonicalURL();
      break;
    case "copyMarkdownLink":
      commandCopyMarkdownLink();
      break;
  }
});
