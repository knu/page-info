import { useEffect, useState } from "react";
import type { ReactNode, ImgHTMLAttributes } from "react";

type Props = {
  src: string;
  placeholderContent: ReactNode;
  errorAttributes?: ImgHTMLAttributes<HTMLImageElement>;
} & ImgHTMLAttributes<HTMLImageElement>;

export const ImageLoader = ({
  src,
  placeholderContent,
  errorAttributes,
  ...attributes
}: Props) => {
  const [imgSrc, setImgSrc] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    if (src) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setIsLoading(false);
        setImgSrc(src);
      };
      img.onerror = () => {
        setIsLoading(false);
        setIsError(true);
        setImgSrc(src);
      };
    } else if (src === null) {
      setIsLoading(false);
    }
  });

  return imgSrc ? (
    <img src={imgSrc} {...(isError ? errorAttributes : attributes)} />
  ) : isLoading ? (
    placeholderContent
  ) : null;
};
