## Unreleased

- Rename the feature "Share URL" to "Save URL online".

## 0.9.2

- Close the popup when the Share URL button is clicked.  The result is shown by a badge.

## 0.9.1

- Make typing Command/Control+Shift+C in the popup copy a Markdown link.
- Make typing Command/Control+C in the popup copy the canonical URL.
- Refactor shortcut key handling and fix key event propagation.  This prevents Command/Control+D from getting unwantedly propagated to the browser and adding a local bookmark.

## 0.9.0

- Add a direct keyboard shortcut to copy a Markdown link to the current page.
- Copy the text/html version of a link in addition when copying a Markdown link.
- Implement a help modal.
- Fix Markdown escaping.
- Fix unreliable background saving to Raindrop.
- Ignore invalid timestamp strings.

## 0.8.0

- Set the default shortcut key for this extension to Command/Control+Shift+I.
- Make typing Command/Control+C in the popup copy a Markdown link.
- Make typing Command/Control+D in the popup invoke Share URL.
- Make typing H/L and Left/Right in the popup switch between panels.
- Navigate to the canonical URL without sending a referrer.
- Fix a regression where the canonical state is reset via the Share URL button.

## 0.7.0

- Allow for copying and sharing a non-canonical link.
    - Show a Non-canonical tab if the canonical URL is different from the tab URL.
- Add a hover popup to the title copy button and the Share URL button.
- Update the icon face even when the tab URL changes via the history API.

## 0.6.2

- Keep the popup open and update the content when the tab is updated while it is open.
- Do not reset the canonical state when the Share URL button is clicked.

## 0.6.1

- Show the publication and modification timestamps if present.
- Check the canonicality by comparing normalized URLs.
- Automatically close the popup when the current tab loads a new page.
- Fix placeholder coloring in the dark mode.

## 0.6.0

- Implement context menu items to copy any link or image as Markdown.
- Enhance the extension popup
   - The site title is now a button to copy a Markdown link.
   - The site image accepts the context menu item to copy it as Markdown.
- Adjust colors in the dark mode.

## 0.5.0

- Implement background URL sharing.
- Add an option to open the share URL popup in background and auto-close it.

## 0.4.0

- Add basic support for `twitter:*` meta tags and show a Twitter tab panel if they are found.
- Add support for the dark mode and adjust styles.

## 0.3.1

- Fix error handling and show the URL and title when run in Chrome extension gallery.
- Fix a performance bug in the popup window.
- Improve Options UI.
- Set the tooltip of the share button.

## 0.3.0

- Implement a Share URL feature and add an options page for that.

## 0.2.1

- Extend support for icons; `shortcut icon` and `apple-touch-icon`.
- Avoid HTML over-unescaping.

## 0.2.0

- Show the site name and icon if available.

## 0.1.0

- Initial release.
