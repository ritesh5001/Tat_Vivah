import React from "react";
import {
  Image,
  type ImageContentFit,
  type ImageSource,
  type ImageStyle,
} from "expo-image";

type CachedImageProps = {
  source: ImageSource | string | number;
  style?: ImageStyle | ImageStyle[];
  contentFit?: ImageContentFit;
  transition?: number;
};

export function CachedImage({
  source,
  style,
  contentFit = "cover",
  transition = 180,
}: CachedImageProps) {
  const resolvedSource = typeof source === "string" ? { uri: source } : source;

  return (
    <Image
      source={resolvedSource}
      style={style}
      contentFit={contentFit}
      transition={transition}
      cachePolicy="memory-disk"
      recyclingKey={typeof source === "string" ? source : undefined}
    />
  );
}
