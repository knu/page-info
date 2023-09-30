import { useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import { Popup } from "semantic-ui-react";
import type { PopupProps } from "semantic-ui-react";
import Shortcuts from "shortcuts";
import { writeViaNavigator } from "./clipboard.ts";

export const CopiableButton = ({
  className,
  title,
  hoverPopupContent,
  clickPopupContent,
  copyText,
  copyHTML,
  enableShortcut = false,
  children,
  ...props
}: {
  className?: string;
  title?: string;
  hoverPopupContent: ReactNode;
  clickPopupContent: ReactNode;
  copyText: string | (() => string | null) | null | undefined;
  copyHTML?: string | (() => string | null) | null;
  enableShortcut?: boolean;
  children: ReactNode;
} & PopupProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [timer, setTimer] = useState<number | undefined>();

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsCopied(false);
    clearTimeout(timer);
  }, [timer]);

  const handleHover = useCallback(() => {
    setIsOpen(true);
    setIsCopied(false);
    clearTimeout(timer);
  }, [timer]);

  const doCopy = useCallback(() => {
    const text = typeof copyText === "function" ? copyText() : copyText;
    if (text == null) return;
    const html = typeof copyHTML === "function" ? copyHTML() : copyHTML;

    writeViaNavigator({ text, html }).then(() => {
      setIsOpen(true);
      setIsCopied(true);
      clearTimeout(timer);
      setTimer(
        setTimeout(() => {
          setIsOpen(false);
          setIsCopied(false);
        }, 750),
      );
    });
  }, [copyText, timer]);

  useEffect(() => {
    if (!enableShortcut) return;

    const shortcuts = new Shortcuts({ capture: true });
    shortcuts.add({
      shortcut: "CmdOrCtrl+C",
      handler: () => {
        const selectedText = window.getSelection()?.toString() ?? "";
        if (selectedText === "") {
          doCopy();
        } else {
          document.execCommand("copy");
        }
      },
    });
    shortcuts.start();
    return () => shortcuts.stop();
  }, [enableShortcut, doCopy]);

  return copyText == null ? (
    children
  ) : (
    <Popup
      trigger={
        <span
          className={className}
          title={title}
          onClick={doCopy}
          onMouseEnter={handleHover}
          onMouseLeave={handleClose}
        >
          {children}
        </span>
      }
      content={isCopied ? clickPopupContent : hoverPopupContent}
      on={[]}
      open={isOpen}
      onClose={handleClose}
      {...props}
    />
  );
};
