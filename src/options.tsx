import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "semantic-ui-css/semantic.min.css";
import { Popup } from "semantic-ui-react";
import { getSaveURLPageScript } from "./worker.ts";

const SaveURLPresets = [
  ["Raindrop", "https://app.raindrop.io/add?link={url}&title={title}"],
  ["Pinboard", "https://pinboard.in/add?url={url}&title={title}"],
  ["Pocket", "https://getpocket.com/edit?url={url}"],
];

const PageInfoOptions = () => {
  const [saveURLIcon, setSaveURLIcon] = useState<string | null>(null);
  const [saveURLTemplate, setSaveURLTemplate] = useState<string | null>(null);
  const [saveURLInBackground, setSaveURLInBackground] = useState<
    boolean | null
  >(null);
  const updateSaveURLTemplate = (newSaveURLTemplate: string | null) => {
    setSaveURLTemplate(newSaveURLTemplate);
    if (newSaveURLTemplate !== null) {
      saveURLIcon ?? setSaveURLIcon("bookmark");
      if (getSaveURLPageScript(newSaveURLTemplate) !== null) {
        saveURLInBackground ?? setSaveURLInBackground(false);
      } else {
        setSaveURLInBackground(null);
      }
    }
  };

  const handleChangeSaveURLIcon = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setSaveURLIcon(event.target.value || null);
  };
  const handleChangeSaveURLTemplate = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => updateSaveURLTemplate(event.target.value || null);
  const handleChangeSaveURLInBackground = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => setSaveURLInBackground(event.target.checked);
  const handleSave = () => {
    chrome.storage.sync.set(
      {
        saveURLIcon,
        saveURLTemplate,
        saveURLInBackground,
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
        saveURLIcon: null,
        saveURLTemplate: null,
        saveURLInBackground: false,
      },
      ({ saveURLIcon, saveURLTemplate, saveURLInBackground }) => {
        setSaveURLIcon(saveURLIcon);
        setSaveURLTemplate(saveURLTemplate);
        setSaveURLInBackground(saveURLInBackground);
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
              Save URL Icon
            </legend>

            <ul className="flex">
              {[null, "bookmark", "share square", "share alternate square"].map(
                (value) => (
                  <li className="flex items-center mr-4">
                    <input
                      type="radio"
                      id="saveURLIcon"
                      name="saveURLIcon"
                      value={value || ""}
                      checked={saveURLIcon == value}
                      onChange={handleChangeSaveURLIcon}
                      className="w-4 h-4 border-gray-300 focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-600 dark:focus:bg-blue-600 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label
                      className={`ml-1 text-sm font-medium text-gray-900 dark:text-gray-300`}
                    >
                      {value ? (
                        <i className={`save-url-icon ${value} icon`} />
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
              htmlFor="saveURLTemplate"
              className="block mb-2 text-base font-medium"
            >
              Save URL Service
            </label>

            <select
              className="block mb-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                const value = event.target.value;
                if (value) {
                  if (saveURLIcon === null) setSaveURLIcon("bookmark");
                  setSaveURLTemplate(value);
                }
              }}
            >
              <option
                value=""
                selected={
                  !SaveURLPresets.some(([_, url]) => saveURLTemplate === url)
                }
              >
                Custom
              </option>
              {SaveURLPresets.map(([label, url]) => (
                <option value={url} selected={saveURLTemplate === url}>
                  {label}
                </option>
              ))}
            </select>

            <div className="space-y-4">
              <Popup
                trigger={
                  <input
                    type="text"
                    id="saveURLTemplate"
                    name="saveURLTemplate"
                    value={saveURLTemplate || undefined}
                    placeholder="https://.../add?url={url}&title={title}"
                    onChange={handleChangeSaveURLTemplate}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  />
                }
                content="In this template, you can use these placeholders: {url} and {title}."
                position="bottom center"
                on="hover"
              />
            </div>

            {saveURLInBackground !== null && (
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="saveURLInBackground"
                  name="saveURLInBackground"
                  checked={saveURLInBackground}
                  onChange={handleChangeSaveURLInBackground}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label
                  htmlFor="saveURLInBackground"
                  className="ml-1 text-sm font-medium text-gray-900 dark:text-gray-300"
                >
                  Open the save URL popup in background and auto-close it.
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
