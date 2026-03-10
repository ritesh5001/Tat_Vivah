import React from "react";
import { Feather } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing, textStyles, typography } from "../theme";

type DrawerRoute = string;

type DrawerMenuProps = {
  visible: boolean;
  onClose: () => void;
  onNavigate: (route: DrawerRoute) => void;
};

const mensCategories = [
  "KURTA & JACKET",
  "SHERWANI & INDO WESTERN",
  "BESTSELLER",
  "NEW ARRIVALS",
] as const;

const shopByProductItems = [
  "KURTA PAJAMA",
  "NEHRU JACKET",
  "INDO WESTERN",
  "JODHPURI SUIT",
] as const;

const categoryToQuery: Record<string, string> = {
  "KURTA & JACKET": "kurta jacket",
  "SHERWANI & INDO WESTERN": "sherwani indo western",
  BESTSELLER: "bestseller",
  "NEW ARRIVALS": "new arrivals",
  "KURTA PAJAMA": "kurta pajama",
  "NEHRU JACKET": "nehru jacket",
  "INDO WESTERN": "indo western",
  "JODHPURI SUIT": "jodhpuri suit",
};

export function DrawerMenu({ visible, onClose, onNavigate }: DrawerMenuProps) {
  const [shopByProductOpen, setShopByProductOpen] = React.useState(false);

  const handleCategory = (category: string) => {
    const query = categoryToQuery[category] ?? category;
    onNavigate(`/search?q=${encodeURIComponent(query)}`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.panel}>
          <Text style={[textStyles.sectionTitle, styles.title]}>Namaskar!</Text>
          <Pressable style={styles.signInRow} onPress={() => { onNavigate("/login"); onClose(); }}>
            <Text style={[textStyles.bodyText, styles.signInText]}>SIGN IN/ SIGN UP</Text>
          </Pressable>

          <View style={styles.linkList}>
            {mensCategories.map((item) => (
              <Pressable
                key={item}
                style={styles.linkButton}
                onPress={() => handleCategory(item)}
              >
                <Text style={[textStyles.bodyText, styles.linkText]}>{item}</Text>
              </Pressable>
            ))}

            <Pressable
              style={styles.accordionRow}
              onPress={() => setShopByProductOpen((prev) => !prev)}
            >
              <Text style={[textStyles.bodyText, styles.linkText]}>SHOP BY PRODUCT</Text>
              <Feather name={shopByProductOpen ? "minus" : "plus"} size={16} color={colors.textPrimary} />
            </Pressable>
            {shopByProductOpen && (
              <View style={styles.accordionContent}>
                {shopByProductItems.map((item) => (
                  <Pressable key={item} style={styles.subLinkButton} onPress={() => handleCategory(item)}>
                    <Text style={[textStyles.bodyText, styles.subLinkText]}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            <Pressable style={styles.linkButton} onPress={() => { onNavigate("/marketplace"); onClose(); }}>
              <Text style={[textStyles.bodyText, styles.linkText]}>ALL MEN&apos;S COLLECTION</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
  panel: {
    width: "76%",
    maxWidth: 320,
    backgroundColor: colors.background,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.lg,
  },
  title: {
    color: colors.headerBrown,
    marginBottom: spacing.md,
    fontFamily: typography.heading,
    fontStyle: "italic",
    textTransform: "none",
    letterSpacing: 0.2,
  },
  signInRow: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  signInText: {
    color: colors.primaryAccent,
    fontFamily: typography.bodyMedium,
    letterSpacing: 0.7,
  },
  linkList: {
    gap: spacing.sm,
  },
  linkButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
  },
  linkText: {
    color: colors.textPrimary,
    fontFamily: typography.bodyMedium,
    letterSpacing: 0.5,
  },
  accordionRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  accordionContent: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  subLinkButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  subLinkText: {
    color: colors.textSecondary,
  },
});
