import { defineManifest } from "@crxjs/vite-plugin";
import { version, description, homepage } from "./package.json";

export default {
  name: "Page Info",
  description,
  version,
  manifest_version: 3,
  homepage_url: homepage,
  action: {
    default_popup: "index.html",
    default_title: "Page Info",
  },
  icons: {
    "16": "src/images/icon16.png",
    "32": "src/images/icon32.png",
    "48": "src/images/icon48.png",
    "128": "src/images/icon128.png",
  },
  background: {
    service_worker: "src/worker.ts",
    type: "module",
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      all_frames: true,
      match_origin_as_fallback: true,
      js: ["src/content.ts"],
      run_at: "document_start",
    },
  ],
  options_ui: {
    page: "options.html",
    open_in_tab: false,
  },
  commands: {
    _execute_action: {
      suggested_key: {
        default: "Ctrl+Shift+I",
        mac: "Command+Shift+I",
      },
    },
    copyMarkdownLink: {
      description: "Copy a Markdown link to the current page",
      suggested_key: {
        default: "Ctrl+Shift+L",
        mac: "Command+Shift+L",
      },
    },
    visitCanonicalURL: {
      description: "Visit the canonical URL of the current page if available",
      suggested_key: {
        default: "Ctrl+Shift+Home",
        mac: "Command+Shift+Home",
      },
    },
  },
  permissions: [
    "activeTab",
    "scripting",
    "webNavigation",
    "contextMenus",
    "alarms",
    "clipboardWrite",
    "storage",
  ],
  host_permissions: ["<all_urls>"],
};
