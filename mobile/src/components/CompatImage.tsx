import * as React from "react";
import {
  Image as RNImage,
  type ImageResizeMode,
  type ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
} from "react-native";

type ContentFit = "cover" | "contain" | "fill" | "none" | "scale-down";

type CompatImageProps = {
  source: ImageSourcePropType | string | undefined | null;
  style?: StyleProp<ImageStyle>;
  contentFit?: ContentFit;
  contentPosition?: string;
  transition?: number;
  cachePolicy?: "none" | "disk" | "memory" | "memory-disk";
};

function toResizeMode(contentFit?: ContentFit): ImageResizeMode {
  switch (contentFit) {
    case "contain":
      return "contain";
    case "fill":
      return "stretch";
    case "none":
      return "center";
    case "scale-down":
      return "contain";
    case "cover":
    default:
      return "cover";
  }
}

function normalizeSource(source: CompatImageProps["source"]): ImageSourcePropType {
  if (typeof source === "string") {
    return { uri: source };
  }
  if (!source) {
    return { uri: "" };
  }
  return source;
}

export function Image({ source, style, contentFit }: CompatImageProps) {
  return <RNImage source={normalizeSource(source)} style={style} resizeMode={toResizeMode(contentFit)} />;
}
