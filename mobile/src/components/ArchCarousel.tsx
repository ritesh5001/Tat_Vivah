import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { CachedImage } from "./CachedImage";
import { colors, spacing, textStyles } from "../theme";

type ArchItem = {
  id: string;
  title: string;
  image: any;
  query: string;
};

type ArchCarouselProps = {
  title: string;
  items: ArchItem[];
  onPressItem?: (query: string) => void;
};

export function ArchCarousel({ title, items, onPressItem }: ArchCarouselProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(Math.max(width * 0.56, 190), 235);
  const cardHeight = Math.round(cardWidth * 1.38);

  return (
    <View>
      <Text style={[textStyles.sectionTitle, styles.sectionTitle]}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            style={[
              styles.card,
              {
                width: cardWidth,
                height: cardHeight,
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
              },
            ]}
            onPress={() => onPressItem?.(item.query)}
          >
            <CachedImage source={item.image} style={StyleSheet.absoluteFillObject} />
            <View style={styles.overlay} />
            <Text style={[textStyles.productTitle, styles.label]}>{item.title}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  row: {
    gap: spacing.md,
    paddingRight: spacing.md,
  },
  card: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  label: {
    color: colors.white,
    textAlign: "center",
    paddingBottom: spacing.md,
    letterSpacing: 0.9,
  },
});
