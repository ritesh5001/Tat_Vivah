import * as React from "react";
import { View, StyleSheet } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText as Text } from "./index";
import { colors, typography } from "../theme/tokens";
import { MotionPressable } from "./motion/MotionPressable";

type NavItem = {
  label: string;
  path: string;
  icon: (color: string) => React.ReactNode;
};

export const APP_BOTTOM_BAR_HEIGHT = 64;

const TAB_ROUTE_PREFIXES = [
  "/home",
  "/marketplace",
  "/reels",
  "/search",
  "/profile",
  "/cart",
  "/wishlist",
  "/orders",
  "/notifications",
  "/categories",
  "/privacy-policy",
  "/return-policy",
  "/refund-policy",
  "/terms",
  "/contact",
];

const NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    path: "/home",
    icon: (color) => <Ionicons name="home-outline" size={22} color={color} />,
  },
  {
    label: "Shop",
    path: "/marketplace",
    icon: (color) => <MaterialIcons name="grid-view" size={22} color={color} />,
  },
  {
    label: "Reels",
    path: "/reels",
    icon: (color) => <Ionicons name="play-circle-outline" size={22} color={color} />,
  },
  {
    label: "Search",
    path: "/search",
    icon: (color) => <Ionicons name="search-outline" size={22} color={color} />,
  },
  {
    label: "Profile",
    path: "/profile",
    icon: (color) => <Ionicons name="person-outline" size={22} color={color} />,
  },
];

function isTabRoute(pathname: string): boolean {
  return TAB_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function GlobalBottomBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  if (isTabRoute(pathname)) {
    return null;
  }

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.path || pathname.startsWith(`${item.path}/`);
        const color = active ? colors.gold : colors.brownSoft;

        return (
          <MotionPressable
            key={item.path}
            style={[styles.item, active && styles.itemActive]}
            onPress={() => router.push(item.path)}
            pressScale={0.97}
            haptic
            preset="fade"
          >
            {active ? <View style={styles.activeIndicator} /> : null}
            {item.icon(color)}
            <Text style={[styles.label, active && styles.activeLabel]}>{item.label}</Text>
          </MotionPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: APP_BOTTOM_BAR_HEIGHT,
    borderTopWidth: 1,
    borderTopColor: "rgba(196, 167, 108, 0.35)",
    backgroundColor: colors.surfaceElevated,
    flexDirection: "row",
    shadowColor: colors.charcoal,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 6,
    elevation: 8,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
    gap: 2,
  },
  itemActive: {
    backgroundColor: "rgba(196, 167, 108, 0.12)",
    borderColor: "rgba(196, 167, 108, 0.2)",
  },
  activeIndicator: {
    width: 20,
    height: 2,
    marginBottom: 2,
    backgroundColor: colors.gold,
  },
  label: {
    fontFamily: typography.sans,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.brownSoft,
  },
  activeLabel: {
    color: colors.gold,
  },
});
