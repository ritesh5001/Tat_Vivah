import * as React from "react";
import {
  type ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
} from "react-native";
import {
  Image as ExpoImage,
  type ImageContentFit,
  type ImageSource,
} from "expo-image";

type ContentFit = "cover" | "contain" | "fill" | "none" | "scale-down";

type CompatImageProps = {
  source: ImageSourcePropType | string | undefined | null;
  style?: StyleProp<ImageStyle>;
  contentFit?: ContentFit;
  contentPosition?: string;
  transition?: number;
  cachePolicy?: "none" | "disk" | "memory" | "memory-disk";
};

function toContentFit(contentFit?: ContentFit): ImageContentFit {
  if (!contentFit) return "cover";
  if (contentFit === "scale-down") return "contain";
  return contentFit;
}

function normalizeSource(source: CompatImageProps["source"]): ImageSource {
  if (typeof source === "string") {
    return { uri: source };
  }
  if (!source) {
    return { uri: "" };
  }
  return source as ImageSource;
}

export function Image({ source, style, contentFit, transition = 180, cachePolicy = "memory-disk" }: CompatImageProps) {
  return (
    <ExpoImage
      source={normalizeSource(source)}
      style={style}
      contentFit={toContentFit(contentFit)}
      transition={transition}
      cachePolicy={cachePolicy}
    />
  );
}
