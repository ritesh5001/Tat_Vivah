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
  items?: { label: string; route: string }[];
}

const baseItems: { label: string; route: string }[] = [
  { label: "Home", route: "/home" },
  { label: "Marketplace", route: "/marketplace" },
  { label: "Search", route: "/search" },
];

export function MenuSheet({ visible, onClose, onNavigate, items }: MenuSheetProps) {
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();
  const { showToast } = useToast();
  const [loggingOut, setLoggingOut] = React.useState(false);
  const logoutLockRef = React.useRef(false);

  const menuItems = React.useMemo(() => {
    if (items) return items;
    if (session?.user) {
      return [
        ...baseItems,
        { label: "Cart", route: "/cart" },
        { label: "Orders", route: "/orders" },
        { label: "Wishlist", route: "/wishlist" },
        { label: "Profile", route: "/profile" },
        { label: "Support", route: "/(tabs)/contact" },
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
        if (loggingOut || logoutLockRef.current) return;
        logoutLockRef.current = true;
        setLoggingOut(true);
        try {
          await signOut();
          showToast("Signed out successfully", "success");
          onClose();
        } finally {
          logoutLockRef.current = false;
          setLoggingOut(false);
        }
        return;
      }
      onNavigate?.(route);
    },
    [loggingOut, onNavigate, onClose, signOut, showToast]
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
              style={[
                styles.menuItem,
                item.route === "__logout__" && loggingOut && styles.menuItemDisabled,
              ]}
              onPress={() => handleNavigate(item.route)}
              disabled={item.route === "__logout__" && loggingOut}
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
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-start",
  },
  sheet: {
    backgroundColor: colors.cream,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderColor: colors.borderSoft,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: typography.serif,
    fontSize: 18,
    color: colors.charcoal,
  },
  closeButton: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 20,
    backgroundColor: colors.warmWhite,
  },
  closeText: {
    fontFamily: typography.sans,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: colors.charcoal,
  },
  menuItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    backgroundColor: "transparent",
  },
  menuItemText: {
    fontFamily: typography.sansMedium,
    fontSize: 11,
    color: colors.charcoal,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
});
