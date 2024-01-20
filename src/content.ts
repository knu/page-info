type MessageHandler = (
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void,
) => boolean | void;

//
// Clipboard copy
//

import { writeViaCommand } from "./clipboard.ts";

const handleCopyToClipboardMessage: MessageHandler = (
  message,
  sender,
  sendResponse,
) => {
  // Use the legacy API because use of the chrome.navigator API
  // unnecessarily demands the clipboard read permission to the
  // site.
  writeViaCommand(message)
    .then(() => sendResponse({ ok: true }))
    .catch((error: Error) => sendResponse({ ok: false, error }));
  return true;
};

//
// Provide information about the element on which the context menu is opened
//

export type ContextAttributes = {
  linkText?: string | null;
  linkTitle?: string | null;
  imageTitle?: string | null;
  imageAlt?: string | null;
};

document.addEventListener("contextmenu", (event: MouseEvent) => {
  const data: ContextAttributes = {};

  const target = event.target as HTMLElement;
  const result = document.evaluate(
    "ancestor-or-self::a[@href] | ancestor-or-self::img[@title or @alt]",
    target,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null,
  );

  for (let i = result.snapshotLength - 1; i >= 0; i--) {
    const element = result.snapshotItem(i) as HTMLElement;
    switch (element.localName) {
      case "img":
        Object.assign(data, {
          imageTitle: element.getAttribute("title"),
          imageAlt: element.getAttribute("alt"),
        });
        break;
      case "a":
        Object.assign(data, {
          linkText:
            document.evaluate(
              "normalize-space(.)",
              element,
              null,
              XPathResult.STRING_TYPE,
              null,
            ).stringValue || "",
          linkTitle: element.getAttribute("title"),
        });
        break;
    }
  }

  chrome.runtime.sendMessage({ action: "updateContextAttributes", data });
});

//
// Observe any possible change in the page info
//

const handleChange = () =>
  chrome.runtime.sendMessage({ action: "updateTabState" });
const attributesObserver = new MutationObserver((mutations) => {
  if (
    mutations.some(
      ({ target, attributeName }) =>
        target instanceof HTMLElement &&
        target.localName === "link" &&
        target.getAttribute("rel") === "canonical" &&
        attributeName === "href",
    )
  ) {
    handleChange();
  }
});
const elementObserver = new MutationObserver((mutations) => {
  let updated = false;

  mutations.forEach(({ target, addedNodes, removedNodes }) => {
    addedNodes.forEach((node) => {
      if (!(node instanceof HTMLElement)) return;

      switch (node.localName) {
        case "head":
          elementObserver.observe(node, { childList: true });
          break;
        case "link":
          attributesObserver.observe(node, { attributes: true });
          updated ||= node.getAttribute("rel") === "canonical";
          break;
      }
    });

    updated ||= Array.from(removedNodes).some(
      (node) =>
        node instanceof HTMLElement &&
        node.localName === "link" &&
        node.getAttribute("rel") === "canonical",
    );
  });

  if (updated) handleChange();
});

document.querySelectorAll("html, head").forEach((element) => {
  elementObserver.observe(element, { childList: true });
});
document.querySelectorAll("link").forEach((element) => {
  attributesObserver.observe(element, { attributes: true });
});

//
// Message listener
//

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "copyToClipboard":
      return handleCopyToClipboardMessage(message, sender, sendResponse);
  }
  return false;
});
