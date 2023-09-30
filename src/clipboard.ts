export const writeViaNavigator = ({
  text,
  html,
}: {
  text?: string | null;
  html?: string | null;
}): Promise<void> => {
  const items: Record<string, string | Blob | PromiseLike<string | Blob>> = {};
  if (text) items["text/plain"] = new Blob([text], { type: "text/plain" });
  if (html) items["text/html"] = new Blob([html], { type: "text/html" });

  return navigator.clipboard.write([new ClipboardItem(items)]);
};

export const writeViaCommand = ({
  text,
  html,
}: {
  text?: string | null;
  html?: string | null;
}): Promise<void> => {
  const handleCopy = (event: ClipboardEvent) => {
    event.preventDefault();
    if (text) event.clipboardData?.setData("text/plain", text);
    if (html) event.clipboardData?.setData("text/html", html);
  };
  document.addEventListener("copy", handleCopy);
  return new Promise<void>((resolve, reject) => {
    try {
      document.execCommand("copy");
      resolve();
    } catch (error) {
      reject(error);
    } finally {
      document.removeEventListener("copy", handleCopy);
    }
  });
};
