import { useState } from "react";
import type { ReactNode } from "react";
import { Popup } from "semantic-ui-react";
import type { PopupProps } from "semantic-ui-react";

export const CopiableButton = ({
  className,
  title,
  hoverPopupContent,
  clickPopupContent,
  copyText,
  children,
  ...props
}: {
  className?: string;
  title?: string;
  hoverPopupContent: ReactNode;
  clickPopupContent: ReactNode;
  copyText: string | (() => string | null) | null | undefined;
  children: ReactNode;
} & PopupProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [timer, setTimer] = useState<number | undefined>();

  const handleClose = () => {
    setIsOpen(false);
    setIsCopied(false);
    clearTimeout(timer);
  };

  const handleHover = () => {
    setIsOpen(true);
    setIsCopied(false);
    clearTimeout(timer);
  };

  const handleClick = (e: React.MouseEvent) => {
    const text = typeof copyText === "function" ? copyText() : copyText;
    if (text == null) return;

    navigator.clipboard.writeText(text).then(() => {
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
  };

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
      content={isCopied ? clickPopupContent : hoverPopupContent}
      on={[]}
      open={isOpen}
      onClose={handleClose}
      {...props}
    />
  );
};
