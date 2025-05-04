# Change Log

## 1.0.5 - 2025-05-04

- Update library versions; ESLint to v9, React to v19, and Semantic-UI-React to v3 beta.

## 1.0.4 - 2024-09-30

- Update background saving for Raindrop.
- Update library versions.

## 1.0.3 - 2024-07-22

- Update library versions.

## 1.0.2 - 2024-01-13

- Fall back to the tab title when the document is not accessible nor have a title such as when it is a PDF document.

## 1.0.1 - 2023-10-30

- Fix the link title always being "Link" when copied other than from the context menu.

## 1.0.0 - 2023-10-26

- Use alt/title attribute values in Markdown/HTML snippets generated via the context menu.
- Relax URL constraints and enable content scripts everywhere so that the context menu items work in iframe without src.

## 0.9.9 - 2023-10-24

- Stop showing placeholders when the title is empty.

## 0.9.8 - 2023-10-24

- Always show a popup as long as the active tab has a URL.
- Detect dynamic changes to the canonical URL of a tab and update the icon face.

## 0.9.7 - 2023-10-19

- Bind "Visit the canonical URL in new tab" to Shift+C.
- Make internal improvements and avoid harmless errors.

## 0.9.6 - 2023-10-18

- Middle click on the Canonical URL button opens it in a background tab.
- Show the extension name and version in the help modal.

## 0.9.5 - 2023-10-12

- Revise the check mark icon.
- Slightly improve the help modal.

## 0.9.4 - 2023-10-09

- Add support for Inoreader to the Save URL feature.
- Show an in-progress badge while transitioning pages in the Save URL process.
- Bring the background Save URL window to the front if a login form is detected in it.

## 0.9.3 - 2023-10-06

- Implement a new shortcut key assignable command: "Visit the canonical URL of the current tab if available".
- Rename the feature "Share URL" to "Save URL online".
- Add a shortcut key "C" for copying the canonical URL in the popup.
- Copy a Markdown link to the current tab page when the context menu item "Copy a Markdown link to the current page" is invoked from within the popup.

## 0.9.2 - 2023-10-05

- Close the popup when the Share URL button is clicked.  The result is shown by a badge.

## 0.9.1 - 2023-10-02

- Make typing Command/Control+Shift+C in the popup copy a Markdown link.
- Make typing Command/Control+C in the popup copy the canonical URL.
- Refactor shortcut key handling and fix key event propagation.  This prevents Command/Control+D from getting unwantedly propagated to the browser and adding a local bookmark.

## 0.9.0 - 2023-10-01

- Add a direct keyboard shortcut to copy a Markdown link to the current page.
- Copy the text/html version of a link in addition when copying a Markdown link.
- Implement a help modal.
- Fix Markdown escaping.
- Fix unreliable background saving to Raindrop.
- Ignore invalid timestamp strings.

## 0.8.0 - 2023-09-30

- Set the default shortcut key for this extension to Command/Control+Shift+I.
- Make typing Command/Control+C in the popup copy a Markdown link.
- Make typing Command/Control+D in the popup invoke Share URL.
- Make typing H/L and Left/Right in the popup switch between panels.
- Navigate to the canonical URL without sending a referrer.
- Fix a regression where the canonical state is reset via the Share URL button.

## 0.7.0 - 2023-09-27

- Allow for copying and sharing a non-canonical link.
    - Show a Non-canonical tab if the canonical URL is different from the tab URL.
- Add a hover popup to the title copy button and the Share URL button.
- Update the icon face even when the tab URL changes via the history API.

## 0.6.2 - 2023-09-26

- Keep the popup open and update the content when the tab is updated while it is open.
- Do not reset the canonical state when the Share URL button is clicked.

## 0.6.1 - 2023-09-26

- Show the publication and modification timestamps if present.
- Check the canonicality by comparing normalized URLs.
- Automatically close the popup when the current tab loads a new page.
- Fix placeholder coloring in the dark mode.

## 0.6.0 - 2023-09-24

- Implement context menu items to copy any link or image as Markdown.
- Enhance the extension popup
   - The site title is now a button to copy a Markdown link.
   - The site image accepts the context menu item to copy it as Markdown.
- Adjust colors in the dark mode.

## 0.5.0 - 2023-09-23

- Implement background URL sharing.
- Add an option to open the share URL popup in background and auto-close it.

## 0.4.0 - 2023-09-21

- Add basic support for `twitter:*` meta tags and show a Twitter tab panel if they are found.
- Add support for the dark mode and adjust styles.

## 0.3.1 - 2023-09-20

- Fix error handling and show the URL and title when run in Chrome extension gallery.
- Fix a performance bug in the popup window.
- Improve Options UI.
- Set the tooltip of the share button.

## 0.3.0 - 2023-09-19

- Implement a Share URL feature and add an options page for that.

## 0.2.1 - 2023-09-16

- Extend support for icons; `shortcut icon` and `apple-touch-icon`.
- Avoid HTML over-unescaping.

## 0.2.0 - 2023-09-16

- Show the site name and icon if available.

## 0.1.0 - 2023-09-06

- Initial public release.
