import { writeViaCommand } from "./clipboard.ts";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.action) {
    case "copyToClipboard":
      // Use the legacy API because use of the chrome.navigator API
      // unnecessarily demands the clipboard read permission to the
      // site.
      writeViaCommand(message)
        .then(() => sendResponse({ ok: true }))
        .catch((error) => sendResponse({ ok: false, error }));
      return true;
  }
  return false;
});
