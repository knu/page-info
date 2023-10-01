import { useState, useCallback, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { Popup } from "semantic-ui-react";
import type { PopupProps } from "semantic-ui-react";
import Shortcuts from "shortcuts";
import { writeViaNavigator } from "./clipboard.ts";

export const CopiableButton = ({
  className,
  title,
  hoverPopupContent,
  copiedPopupContent,
  clickedPopupContent,
  copyText,
  copyHTML,
  shortcutKey,
  onClick,
  children,
  ...props
}: {
  className?: string;
  title?: string;
  hoverPopupContent: ReactNode;
  copiedPopupContent: ReactNode;
  clickedPopupContent?: ReactNode;
  copyText: string | (() => string | null) | null | undefined;
  copyHTML?: string | (() => string | null) | null;
  shortcutKey?: string | string[] | null;
  onClick?: React.MouseEventHandler;
  children: ReactNode;
} & PopupProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
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
    const shortcutKeys =
      typeof shortcutKey === "string" ? [shortcutKey] : shortcutKey ?? [];
    if (shortcutKeys.length === 0) return;

    const shortcuts = new Shortcuts({ capture: true });
    const handler = () => {
      if (window.getSelection()?.toString()) return false;
      doCopy();
      return true;
    };
    shortcuts.add(shortcutKeys.map((shortcut) => ({ shortcut, handler })));
    shortcuts.start();
    return () => shortcuts.stop();
  }, [shortcutKey, doCopy]);

  const handleClick = useMemo(
    () =>
      onClick == null
        ? doCopy
        : (e: React.MouseEvent) => {
            onClick(e);
            setIsOpen(true);
            setIsClicked(true);
            clearTimeout(timer);
            setTimer(
              setTimeout(() => {
                setIsOpen(false);
                setIsClicked(false);
              }, 750),
            );
          },
    [onClick, doCopy, timer],
  );

  return copyText == null ? (
    children
  ) : (
    <Popup
      trigger={
        <span
          className={className}
          title={title}
          onClick={handleClick}
          onMouseEnter={handleHover}
          onMouseLeave={handleClose}
        >
          {children}
        </span>
      }
      content={
        isCopied
          ? copiedPopupContent
          : isClicked
          ? clickedPopupContent
          : hoverPopupContent
      }
      on={[]}
      open={isOpen}
      onClose={handleClose}
      {...props}
    />
  );
};
