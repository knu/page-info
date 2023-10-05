# Page Info

This is a Chrome extension with many features to help check the information about the pages you are viewing.

No SEO hypes, no access to any external server.  This extension serves as a simple and unobtrusive utility for daily browsing.

Here is a list of implemented features:

- Canonical URL Checker

    When a web page is loaded, the extension checks if the URL is canonical and changes its icon face depending on the canonical state.

- Page Information Viewer

    Clicking the extension icon shows a popup window in which you can check out the following pieces of information:

    - the canonical URL you can follow or copy (&lt;link rel="canonical"&gt;)
    - the site name (og:site_name) and icon (og:icon or &lt;link rel="icon"&gt;)
    - the image (og:image)
    - the page title (og:title or &lt;title&gt;)
        - it also works as a button to copy the link to the page as Markdown
    - Twitter flavored equivalents for the above items (twitter:*)
    - the modification and publication time stamps (article:published_time and article:modified_time)

- Customizable Save URL Button

    A customizable Save URL button can be added to the popup window, with which you can bookmark the current page online with any popular service on the fly, optionally in the background.

    Background sharing supports Raindrop, Pocket and Pinboard.

- Copy As Markdown

    This extension provides context menu items to copy any link or image as Markdown.  Copying a Markdown link also stores a rich text version in HTML in the clipboard so you can paste a link right away to any WYSIWYG editor, Slack, Google Docs, etc.

    A shortcut key can be configured to copy a link to the current page as Markdown. (Default: <kbd>Command+Shift+L</kbd> on macOS, <kbd>Ctrl+Shift+L</kbd> on Windows and Linux)

## Author

Copyright (c) 2023 Akinori MUSHA.

Licensed under the 2-clause BSD license.  See `LICENSE.txt` for details.

Visit the [GitHub Repository](https://github.com/knu/page-info) for the latest information.
