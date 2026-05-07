import * as React from "react";
import {
  Modal,
  Pressable,
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography } from "../theme/tokens";
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
  { label: "Reels", route: "/reels" },
  { label: "Search", route: "/search" },
];

const DRAWER_WIDTH = Math.min(340, Math.round(Dimensions.get("window").width * 0.82));

const MENU_ICON_BY_ROUTE: Record<string, keyof typeof Ionicons.glyphMap> = {
  "/home": "home-outline",
  "/marketplace": "bag-handle-outline",
  "/reels": "videocam-outline",
  "/search": "search-outline",
  "/cart": "cart-outline",
  "/orders": "receipt-outline",
  "/wishlist": "heart-outline",
  "/profile": "person-outline",
  "/contact": "headset-outline",
  "/login": "log-in-outline",
  "/register": "person-add-outline",
  "__logout__": "log-out-outline",
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MenuSheet({ visible, onClose, onNavigate, items }: MenuSheetProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();
  const { showToast } = useToast();
  const [loggingOut, setLoggingOut] = React.useState(false);
  const logoutLockRef = React.useRef(false);
  const openedAtRef = React.useRef(0);
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;
  const drawerTranslateX = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  const normalizeRoute = React.useCallback((route: string) => {
    if (route.startsWith("/(tabs)/")) {
      return `/${route.slice("/(tabs)/".length)}`;
    }
    if (route.startsWith("/(auth)/")) {
      return `/${route.slice("/(auth)/".length)}`;
    }
    return route;
  }, []);

  const menuItems = React.useMemo(() => {
    if (items) return items;
    if (session?.user) {
      return [
        ...baseItems,
        { label: "Cart", route: "/cart" },
        { label: "Orders", route: "/orders" },
        { label: "Wishlist", route: "/wishlist" },
        { label: "Profile", route: "/profile" },
        { label: "Support", route: "/contact" },
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
          router.push("/home");
        } finally {
          logoutLockRef.current = false;
          setLoggingOut(false);
        }
        return;
      }
      const nextRoute = normalizeRoute(route);
      onClose();
      if (onNavigate) {
        onNavigate(nextRoute);
      } else {
        router.push(nextRoute as any);
      }
    },
    [loggingOut, normalizeRoute, onNavigate, onClose, router, signOut, showToast]
  );

  const closeMenu = React.useCallback(() => {
    if (loggingOut) return;
    onClose();
  }, [loggingOut, onClose]);

  const handleOverlayPress = React.useCallback(() => {
    // Ignore the first overlay tap right after open to avoid same-tap close.
    if (Date.now() - openedAtRef.current < 260) {
      return;
    }
    closeMenu();
  }, [closeMenu]);

  React.useEffect(() => {
    if (visible) {
      openedAtRef.current = Date.now();
      overlayOpacity.setValue(0);
      drawerTranslateX.setValue(-DRAWER_WIDTH);

      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(drawerTranslateX, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [drawerTranslateX, overlayOpacity, visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={closeMenu}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        <AnimatedPressable
          style={[styles.overlay, { opacity: overlayOpacity }]}
          onPress={handleOverlayPress}
        />

        <Animated.View
          style={[
            styles.drawer,
            {
              paddingTop: Math.max(insets.top, spacing.lg),
              paddingBottom: Math.max(insets.bottom, spacing.lg),
              transform: [{ translateX: drawerTranslateX }],
            },
          ]}
        >
          <View style={styles.drawerHeader}>
            <View>
              <Text style={styles.title}>Tatvivah</Text>
              <Text style={styles.subtitle}>Navigation</Text>
            </View>

            <Pressable onPress={closeMenu} style={styles.closeIconButton} hitSlop={8}>
              <Ionicons name="close" size={18} color={colors.charcoal} />
            </Pressable>
          </View>

          <View style={styles.menuList}>
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
                <View style={styles.menuItemLeft}>
                  <Ionicons
                    name={MENU_ICON_BY_ROUTE[item.route] ?? "ellipse-outline"}
                    size={17}
                    color={colors.charcoal}
                  />
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={colors.brownSoft} />
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-start",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: "100%",
    backgroundColor: colors.cream,
    paddingHorizontal: spacing.lg,
    borderRightWidth: 1,
    borderRightColor: colors.borderSoft,
    shadowColor: colors.charcoal,
    shadowOpacity: 0.2,
    shadowOffset: { width: 8, height: 0 },
    shadowRadius: 16,
    elevation: 8,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  title: {
    fontFamily: typography.serif,
    fontSize: 24,
    color: colors.charcoal,
    lineHeight: 26,
  },
  subtitle: {
    marginTop: 2,
    fontFamily: typography.sans,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.3,
    color: colors.brownSoft,
  },
  closeIconButton: {
    width: 34,
    height: 34,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.warmWhite,
    alignItems: "center",
    justifyContent: "center",
  },
  menuList: {
    gap: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  menuItemText: {
    fontFamily: typography.sansMedium,
    fontSize: 13,
    color: colors.charcoal,
    letterSpacing: 0.4,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
});
