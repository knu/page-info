import { getPageInfo } from "./getPageInfo.ts";
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
