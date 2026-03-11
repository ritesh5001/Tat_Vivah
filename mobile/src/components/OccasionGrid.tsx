import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, textStyles } from "../theme";
import { images } from "../data/images";
import { CachedImage } from "./CachedImage";

type OccasionGridProps = {
  items?: Array<{
    id: string;
    title: string;
    image: string;
    query: string;
  }>;
  onSelectOccasion?: (query: string) => void;
};

const occasions = [
  { id: "o1", title: "WEDDING", query: "wedding", image: images.categories.wedding },
  { id: "o2", title: "FESTIVE", query: "kurta", image: images.categories.kurta },
  { id: "o3", title: "RECEPTION", query: "indo western", image: images.categories.indoWestern },
  { id: "o4", title: "ACCESSORIES", query: "accessories", image: images.categories.accessories },
];

export function OccasionGrid({ items, onSelectOccasion }: OccasionGridProps) {
  const cards = items?.length
    ? items
    : occasions.map((item) => ({
        id: item.id,
        title: item.title,
        image: item.image,
        query: item.query,
      }));

  return (
    <View>
      <Text style={[textStyles.sectionTitle, styles.sectionTitle]}>SHOP THE OCCASION</Text>
      <Text style={[textStyles.bodyText, styles.sectionCopy]}>
        Curated ensembles for every celebration, arranged in a gallery-inspired edit.
      </Text>
      <View style={styles.grid}>
        {cards.map((item, index) => (
          <Pressable
            key={item.id}
            style={[
              styles.card,
              index === 0 && styles.cardLarge,
              index === 1 && styles.cardTall,
              index === 2 && styles.cardTall,
              index === 3 && styles.cardWide,
            ]}
            onPress={() => onSelectOccasion?.(item.query)}
          >
            <CachedImage source={item.image} style={styles.image} />
            <View style={styles.overlay} />
            <View style={styles.labelWrap}>
              <Text style={[textStyles.productTitle, styles.label]}>{item.title}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  sectionCopy: {
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  card: {
    width: "48%",
    height: 190,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "flex-end",
    backgroundColor: colors.white,
  },
  cardLarge: {
    width: "100%",
    height: 240,
  },
  cardTall: {
    height: 220,
  },
  cardWide: {
    width: "100%",
    height: 210,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.24)",
  },
  labelWrap: {
    margin: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(34, 20, 14, 0.45)",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  label: {
    color: colors.white,
    textAlign: "center",
    textTransform: "none",
  },
});
