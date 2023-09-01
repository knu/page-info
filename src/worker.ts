import { getPageInfo } from "./getPageInfo.ts";

type CanonicalState = "canonical" | "noncanonical" | "unknown";

const canonicalStates = new Map<number, CanonicalState>();

const fetchCanonicalState = async (tabId: number, force?: boolean) => {
  if (!force) {
    const state = canonicalStates.get(tabId);
    if (state) return state;
  }

  const { url } = await chrome.tabs.get(tabId);
  if (!url || !/^https?:\/\//.test(url)) return "unknown";

  try {
    const [
      {
        result: { canonicalUrl },
      },
    ] = await chrome.scripting.executeScript({
      target: { tabId },
      func: getPageInfo,
    });

    const state =
      url === canonicalUrl
        ? "canonical"
        : canonicalUrl
          ? "noncanonical"
          : "unknown";
    canonicalStates.set(tabId, state);
    return state;
  } catch (e) {
    if (/cannot be scripted/.test(`${e}`)) {
      return "unknown";
    } else {
      throw e;
    }
  }
};

const clearCanonicalState = (tabId: number) => {
  canonicalStates.delete(tabId);
};

const defaultTitle = chrome.runtime.getManifest().action
  .default_title as string;

const showCanonicalState = (state: CanonicalState) => {
  switch (state) {
    case "canonical":
      chrome.action.setBadgeText({ text: "✔︎︎" });
      chrome.action.setTitle({
        title: `${defaultTitle} - This URL is canonical.︎︎`,
      });
      break;
    case "noncanonical":
      chrome.action.setBadgeText({ text: "⇢" });
      chrome.action.setTitle({
        title: `${defaultTitle} - There is a canonical URL for this page︎︎.`,
      });
      break;
    default:
      chrome.action.setBadgeText({ text: "" });
      chrome.action.setTitle({ title: defaultTitle });
  }
};

chrome.tabs.onActivated.addListener(({ tabId }) => {
  fetchCanonicalState(tabId).then(showCanonicalState);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  clearCanonicalState(tabId);
});

chrome.webNavigation.onCompleted.addListener(({ frameId, tabId }) => {
  if (frameId !== 0 || tabId == null) return;

  fetchCanonicalState(tabId, true).then(showCanonicalState);
});

export { };
