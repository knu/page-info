import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "semantic-ui-css/semantic.min.css";
import { Popup } from "semantic-ui-react";

const ShareURLPresets = [
  ["Raindrop", "https://app.raindrop.io/add?link={url}&title={title}"],
  ["Pinboard", "https://pinboard.in/add?url={url}&title={title}"],
  ["Pocket", "https://getpocket.com/edit?url={url}"],
];

const PageInfoOptions = () => {
  const [shareIcon, setShareIcon] = useState<string | null>(null);
  const [shareURLTemplate, setShareURLTemplate] = useState<string | null>(null);

  const handleChangeShareIcon = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setShareIcon(event.target.value || null);
  };
  const handleChangeShareURLTemplate = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setShareURLTemplate(event.target.value || null);
  };

  const handleSave = () => {
    chrome.storage.sync.set(
      {
        shareIcon,
        shareURLTemplate,
      },
      () => window.close(),
    );
  };

  useEffect(() => {
    chrome.storage.sync.get(
      {
        shareIcon: null,
        shareURLTemplate: null,
      },
      ({ shareIcon, shareURLTemplate }) => {
        setShareIcon(shareIcon);
        setShareURLTemplate(shareURLTemplate);
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
        >
          <div className="mb-4">
            <p className="block mb-2 text-base font-medium">Share Icon</p>

            {[null, "bookmark", "share square", "share alternate square"].map(
              (value, i) => (
                <label className={`${i > 0 ? "ml-2" : ""}`}>
                  <input
                    type="radio"
                    name="shareIcon"
                    value={value || ""}
                    checked={shareIcon == value}
                    onChange={handleChangeShareIcon}
                    className="mr-1"
                  />
                  {value ? (
                    <i className={`share-icon ${value} icon`} />
                  ) : (
                    "None"
                  )}
                </label>
              ),
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="shareURLTemplate"
              className="block mb-2 text-base font-medium"
            >
              Share URL Template
            </label>

            <select
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                const value = event.target.value;
                if (value) setShareURLTemplate(value);
              }}
            >
              <option value="" selected>
                Custom
              </option>
              {ShareURLPresets.map(([label, url]) => (
                <option value={url}>{label}</option>
              ))}
            </select>

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

          <button
            onClick={handleSave}
            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 focus:outline-none"
          >
            Save
          </button>
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
