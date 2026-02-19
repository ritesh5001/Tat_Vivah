import * as React from "react";
import { Modal, Pressable, View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing, typography } from "../theme/tokens";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../providers/ToastProvider";

interface MenuSheetProps {
  visible: boolean;
  onClose: () => void;
  onNavigate?: (route: string) => void;
  items?: Array<{ label: string; route: string }>;
}

const baseItems: Array<{ label: string; route: string }> = [
  { label: "Home", route: "/home" },
  { label: "Marketplace", route: "/marketplace" },
  { label: "Shop", route: "/search" },
];

export function MenuSheet({ visible, onClose, onNavigate, items }: MenuSheetProps) {
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();
  const { showToast } = useToast();

  const menuItems = React.useMemo(() => {
    if (items) return items;
    if (session?.user) {
      return [
        ...baseItems,
        { label: "Cart", route: "/cart" },
        { label: "Wishlist", route: "/wishlist" },
        { label: "Orders", route: "/orders" },
        { label: "Notifications", route: "/notifications" },
        { label: "Profile", route: "/profile" },
        { label: "Logout", route: "__logout__" },
      ];
    }
    return [
      ...baseItems,
      { label: "Sign in", route: "/login" },
      { label: "Create account", route: "/register" },
    ];
  }, [items, session?.user]);

  const handleNavigate = React.useCallback(
    async (route: string) => {
      if (route === "__logout__") {
        await signOut();
        showToast("Signed out successfully", "success");
        onClose();
        return;
      }
      onNavigate?.(route);
    },
    [onNavigate, onClose, signOut, showToast]
  );

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
              onPress={() => handleNavigate(item.route)}
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
