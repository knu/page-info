import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "semantic-ui-css/semantic.min.css";
import { Popup } from "semantic-ui-react";
import { getShareURLPageScript } from "./worker.ts";

const ShareURLPresets = [
  ["Raindrop", "https://app.raindrop.io/add?link={url}&title={title}"],
  ["Pinboard", "https://pinboard.in/add?url={url}&title={title}"],
  ["Pocket", "https://getpocket.com/edit?url={url}"],
];

const PageInfoOptions = () => {
  const [shareIcon, setShareIcon] = useState<string | null>(null);
  const [shareURLTemplate, setShareURLTemplate] = useState<string | null>(null);
  const [shareURLInBackground, setShareURLInBackground] = useState<
    boolean | null
  >(null);
  const updateShareURLTemplate = (newShareURLTemplate: string | null) => {
    setShareURLTemplate(newShareURLTemplate);
    if (newShareURLTemplate !== null) {
      shareIcon ?? setShareIcon("bookmark");
      if (getShareURLPageScript(newShareURLTemplate) !== null) {
        shareURLInBackground ?? setShareURLInBackground(false);
      } else {
        setShareURLInBackground(null);
      }
    }
  };

  const handleChangeShareIcon = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setShareIcon(event.target.value || null);
  };
  const handleChangeShareURLTemplate = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => updateShareURLTemplate(event.target.value || null);
  const handleChangeShareURLInBackground = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => setShareURLInBackground(event.target.checked);
  const handleSave = () => {
    chrome.storage.sync.set(
      {
        shareIcon,
        shareURLTemplate,
        shareURLInBackground,
      },
      () => window.close(),
    );
  };

  useEffect(() => {
    document.body.classList.add(
      "text-black",
      "dark:text-white",
      "bg-white",
      "dark:bg-gray-800",
    );

    chrome.storage.sync.get(
      {
        shareIcon: null,
        shareURLTemplate: null,
        shareURLInBackground: false,
      },
      ({ shareIcon, shareURLTemplate, shareURLInBackground }) => {
        setShareIcon(shareIcon);
        setShareURLTemplate(shareURLTemplate);
        setShareURLInBackground(shareURLInBackground);
      },
    );
  }, []);

  return (
    <div id="container" className="overflow-auto p-3">
      <div className="">
        <h1 className="text-lg">Page Info Options</h1>

        <form
          onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            return false;
          }}
          className="space-y-4"
        >
          <fieldset>
            <legend className="block mb-2 text-base font-medium">
              Share Icon
            </legend>

            <ul className="flex">
              {[null, "bookmark", "share square", "share alternate square"].map(
                (value) => (
                  <li className="flex items-center mr-4">
                    <input
                      type="radio"
                      id="shareIcon"
                      name="shareIcon"
                      value={value || ""}
                      checked={shareIcon == value}
                      onChange={handleChangeShareIcon}
                      className="w-4 h-4 border-gray-300 focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-600 dark:focus:bg-blue-600 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label
                      className={`ml-1 text-sm font-medium text-gray-900 dark:text-gray-300`}
                    >
                      {value ? (
                        <i className={`share-icon ${value} icon`} />
                      ) : (
                        "Disabled"
                      )}
                    </label>
                  </li>
                ),
              )}
            </ul>
          </fieldset>

          <fieldset>
            <label
              htmlFor="shareURLTemplate"
              className="block mb-2 text-base font-medium"
            >
              Share URL Template
            </label>

            <select
              className="block mb-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                const value = event.target.value;
                if (value) {
                  if (shareIcon === null) setShareIcon("bookmark");
                  setShareURLTemplate(value);
                }
              }}
            >
              <option
                value=""
                selected={
                  !ShareURLPresets.some(([_, url]) => shareURLTemplate === url)
                }
              >
                Custom
              </option>
              {ShareURLPresets.map(([label, url]) => (
                <option value={url} selected={shareURLTemplate === url}>
                  {label}
                </option>
              ))}
            </select>

            <div className="space-y-4">
              <Popup
                trigger={
                  <input
                    type="text"
                    id="shareURLTemplate"
                    name="shareURLTemplate"
                    value={shareURLTemplate || undefined}
                    placeholder="https://.../add?url={url}&title={title}"
                    onChange={handleChangeShareURLTemplate}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  />
                }
                content="In this template, you can use these placeholders: {url} and {title}."
                position="bottom center"
                on="hover"
              />
            </div>

            {shareURLInBackground !== null && (
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="shareURLInBackground"
                  name="shareURLInBackground"
                  checked={shareURLInBackground}
                  onChange={handleChangeShareURLInBackground}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label
                  htmlFor="shareURLInBackground"
                  className="ml-1 text-sm font-medium text-gray-900 dark:text-gray-300"
                >
                  Open the share URL popup in background and auto-close it.
                </label>
              </div>
            )}
          </fieldset>

          <fieldset>
            <button
              onClick={handleSave}
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 focus:outline-none"
            >
              Save
            </button>
          </fieldset>
        </form>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <PageInfoOptions />
  </React.StrictMode>,
);
