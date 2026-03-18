import React, { memo } from "react";
import { Feather } from "@expo/vector-icons";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from "react-native";
import { colors, spacing, textStyles } from "../theme";
import { CachedImage } from "./CachedImage";

type ProductCardProps = {
  id: string;
  name: string;
  price: number;
  imageUri?: string;
  thumbnailUri?: string;
  isWishlisted?: boolean;
  onPress?: (id: string) => void;
  onWishlistPress?: (id: string) => void;
};

function ProductCardBase({
  id,
  name,
  price,
  imageUri,
  thumbnailUri,
  isWishlisted = false,
  onPress,
  onWishlistPress,
}: ProductCardProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(Math.max(width * 0.46, 160), 190);

  const source: ImageSourcePropType = imageUri
    ? { uri: imageUri }
    : require("../../assets/icon.png");

  return (
    <Pressable onPress={() => onPress?.(id)} style={[styles.card, { width: cardWidth }] }>
      <View style={styles.imageWrap}>
        <CachedImage
          source={source}
          style={[styles.image, { height: Math.round(cardWidth * 1.28) }]}
        />

        <Pressable
          onPress={() => onWishlistPress?.(id)}
          hitSlop={8}
          style={styles.wishlistButton}
        >
          <Feather
            name={isWishlisted ? "heart" : "heart"}
            size={16}
            color={isWishlisted ? colors.primaryAccent : colors.textPrimary}
          />
        </Pressable>
      </View>

      <Text numberOfLines={2} style={[textStyles.productTitle, styles.name]}>
        {name}
      </Text>
      <Text style={[textStyles.bodyText, styles.price]}>{`₹${price.toLocaleString("en-IN")}`}</Text>
    </Pressable>
  );
}

export const ProductCard = memo(ProductCardBase);

const styles = StyleSheet.create({
  card: {
    width: 180,
  },
  imageWrap: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  image: {
    width: "100%",
    height: 230,
  },
  wishlistButton: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  price: {
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
});
