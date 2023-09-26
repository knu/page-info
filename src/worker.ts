import { getPageInfo } from "./getPageInfo.ts";
import { parseTemplate } from "url-template";
import type { Template } from "url-template";
import { getMarkdownForContext } from "./Markdown.ts";
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

const safeAsync = <T, E>(
  promise: Promise<T>,
  onErrorResolve: (e: any) => E,
): Promise<T | E> =>
  new Promise<T | E>((resolve, _reject) =>
    promise.then(resolve).catch((e) => resolve(onErrorResolve(e))),
  );

// Canonical URL detection

type CanonicalState = "canonical" | "noncanonical" | "unknown";

const canonicalStates = new Map<number, CanonicalState>();

const fetchCanonicalState = async (tabId: number, force?: boolean) => {
  if (!force) {
    const state = canonicalStates.get(tabId);
    if (state) return state;
  }

  const { url } = await safeAsync(chrome.tabs.get(tabId), (_e) => ({
    url: undefined,
  }));
  if (!url || !/^https?:\/\//.test(url)) return "unknown";

  try {
    const [
      {
        result: { canonicalUrl, isCanonical },
      },
    ] = await chrome.scripting.executeScript({
      target: { tabId },
      func: getPageInfo,
    });

    const state = isCanonical
      ? "canonical"
      : canonicalUrl
      ? "noncanonical"
      : "unknown";
    canonicalStates.set(tabId, state);
    return state;
  } catch (e) {
    if (!/cannot be scripted|was removed/.test(`${e}`)) {
      console.error(e);
    }
    return "unknown";
  }
};

const clearCanonicalState = (tabId: number) => {
  canonicalStates.delete(tabId);
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

const showCanonicalState = (state: CanonicalState) => {
  switch (state) {
    case "canonical":
      chrome.action.setIcon({ path: canonicalIcon });
      chrome.action.setTitle({
        title: `${defaultTitle} - This URL is canonical.︎︎`,
      });
      break;
    case "noncanonical":
      chrome.action.setIcon({ path: noncanonicalIcon });
      chrome.action.setTitle({
        title: `${defaultTitle} - There is a canonical URL for this page︎︎.`,
      });
      break;
    default:
      chrome.action.setIcon({ path: normalIcon });
      chrome.action.setTitle({ title: defaultTitle });
  }
};

chrome.tabs.onActivated.addListener(({ tabId }) => {
  if (shareURLTabs.has(tabId)) return;
  fetchCanonicalState(tabId).then(showCanonicalState);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  clearCanonicalState(tabId);
});

chrome.webNavigation.onCompleted.addListener(({ frameId, tabId }) => {
  if (frameId !== 0 || tabId == null) return;
  if (shareURLTabs.has(tabId)) return;

  fetchCanonicalState(tabId, true).then(showCanonicalState);

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

  const markdown = getMarkdownForContext(info, tab);
  if (!markdown) return;

  if (tab.url?.startsWith(`chrome-extension://${chrome.runtime.id}/`)) {
    chrome.runtime
      .sendMessage({ action: "copyToClipboard", text: markdown })
      .then(({ ok }) => (ok ? showSuccessBadge() : showFailureBadge()))
      .catch(() => showFailureBadge());
  } else {
    chrome.scripting
      .executeScript({
        target: { tabId },
        func: (markdown) => navigator.clipboard.writeText(markdown),
        args: [markdown],
      })
      .then(() => showSuccessBadge())
      .catch(() => showFailureBadge());
  }
});

chrome.runtime.onInstalled.addListener(() => {
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

// Background URL sharing

export type ShareURLMessage = {
  action: "shareURL";
  url: string;
  title: string;
};

type MessageListener = (
  message: ShareURLMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void,
) => boolean;

const shareURLTabs = new Set<number>();

const handleShareURLMessage = (
  message: ShareURLMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void,
): boolean => {
  const { url, title } = message;
  chrome.storage.sync
    .get({
      shareURLTemplate: null,
      shareURLInBackground: false,
    })
    .then(({ shareURLTemplate, shareURLInBackground }) => {
      if (typeof shareURLTemplate !== "string") return;

      const shareURL = parseTemplate(shareURLTemplate).expand({ url, title });
      const width = 450;
      const height = 600;

      chrome.windows
        .create({
          url: shareURL,
          type: "popup",
          focused: !shareURLInBackground,
          width,
          height,
        })
        .then(({ tabs }) => {
          tabs?.forEach(({ id }) => id && shareURLTabs.add(id));
          sendResponse({ ok: true });
        })
        .catch((e) => sendResponse({ ok: false }));
    });

  return true;
};

const getShareURLPageScript = (url: string): (() => Promise<string>) | null => {
  switch (new URL(url).host) {
    case "app.raindrop.io":
      return () =>
        new Promise((resolve) => {
          const url = new URL(window.location.href);
          const timer = setInterval(() => {
            if (document.readyState === "complete" && !document.hasFocus()) {
              if (/Bookmark saved/.test(document.title)) {
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
  if (!shareURLTabs.has(tabId)) return;

  const { shareURLInBackground } = await chrome.storage.sync.get({
    shareURLInBackground: false,
  });
  if (!shareURLInBackground) return;

  const { url } = await chrome.tabs.get(tabId);
  if (!url || !/^https?:\/\//.test(url)) return;

  const func = getShareURLPageScript(url);
  if (!func) return;

  chrome.scripting
    .executeScript({
      target: { tabId },
      func,
    })
    .then(([{ result }]) => {
      if (result === "done") chrome.tabs.remove(tabId);
    })
    .catch(() => {});
});

chrome.tabs.onRemoved.addListener((tabId) => {
  shareURLTabs.delete(tabId);
});

const messageListener: MessageListener = (message, sender, sendResponse) => {
  const { action } = message;

  switch (action) {
    case "shareURL":
      return handleShareURLMessage(message, sender, sendResponse);
  }

  return false;
};

chrome.runtime.onMessage.addListener(messageListener);

export { getShareURLPageScript };
