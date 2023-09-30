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
