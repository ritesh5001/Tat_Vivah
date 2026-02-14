import * as React from "react";
import { Modal, Pressable, View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing, typography } from "../theme/tokens";

interface MenuSheetProps {
  visible: boolean;
  onClose: () => void;
  onNavigate?: (
    route:
      | "Home"
      | "Marketplace"
      | "Bestsellers"
      | "NewArrivals"
      | "SignIn"
      | "CreateAccount"
  ) => void;
}

const menuItems: Array<{
  label: string;
  route: "Home" | "Marketplace" | "Bestsellers" | "NewArrivals" | "SignIn" | "CreateAccount";
}> = [
  { label: "Home", route: "Home" },
  { label: "Marketplace", route: "Marketplace" },
  { label: "Bestsellers", route: "Bestsellers" },
  { label: "New Arrivals", route: "NewArrivals" },
  { label: "Sign in", route: "SignIn" },
  { label: "Create account", route: "CreateAccount" },
];

export function MenuSheet({ visible, onClose, onNavigate }: MenuSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingTop: Math.max(insets.top, spacing.lg) }]}
          onPress={() => {}}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.sheetHeader}>
            <Text style={styles.title}>Menu</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
          {menuItems.map((item) => (
            <Pressable
              key={item.route}
              style={styles.menuItem}
              onPress={() => onNavigate?.(item.route)}
            >
              <Text style={styles.menuItemText}>{item.label}</Text>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(44, 40, 37, 0.35)",
    justifyContent: "flex-start",
  },
  sheet: {
    backgroundColor: colors.warmWhite,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: typography.serif,
    fontSize: 20,
    color: colors.charcoal,
  },
  closeButton: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 16,
  },
  closeText: {
    fontFamily: typography.sans,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: colors.charcoal,
  },
  menuItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  menuItemText: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    color: colors.charcoal,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
});
