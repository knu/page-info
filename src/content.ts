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
          updated ||= node.getAttribute("rel") === "canonical" ?? false;
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
