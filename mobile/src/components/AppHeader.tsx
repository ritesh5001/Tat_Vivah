import * as React from "react";
import { View, Text, StyleSheet, Pressable, Animated, Easing, TouchableOpacity } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../theme/tokens";
import { images } from "../data/images";
import { MenuSheet } from "./MenuSheet";
import { Image } from "./CompatImage";

interface AppHeaderProps {
  variant?: "main" | "sub";
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showMenu?: boolean;
  showSearch?: boolean;
  showProfile?: boolean;
  showWishlist?: boolean;
  showCart?: boolean;
}

const ANNOUNCEMENTS = [
  "Verified Sellers",
  "Secure Payments",
  "Premium Ethnic Wear",
  "Pan-India Shipping",
  "Easy Returns",
  "Authentic Designs",
];

export function AppHeader({
  variant = "sub",
  title,
  subtitle,
  showBack,
  showMenu,
  showSearch,
  showProfile,
  showWishlist,
  showCart,
}: AppHeaderProps) {
  void subtitle;
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [marqueeTrackWidth, setMarqueeTrackWidth] = React.useState(0);
  const marqueeTranslateX = React.useRef(new Animated.Value(0)).current;

  const isMainHeader = variant === "main";
  const shouldShowBack = isMainHeader ? false : (showBack ?? pathname !== "/home");
  const shouldShowMenu = showMenu ?? true;
  const shouldShowSearch = showSearch ?? isMainHeader;
  const shouldShowProfile = showProfile ?? false;
  const shouldShowWishlist = showWishlist ?? false;
  const shouldShowCart = showCart ?? isMainHeader;
  const marqueeItems = React.useMemo(() => [...ANNOUNCEMENTS, ...ANNOUNCEMENTS], []);
  const backFallbackRoute = "/home";

  const handleOpenMenu = React.useCallback(() => {
    console.log("MENU CLICKED");
    setMenuOpen(true);
  }, []);

  const handleBack = React.useCallback(() => {
    if (pathname === backFallbackRoute) {
      router.replace(backFallbackRoute);
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(backFallbackRoute);
  }, [backFallbackRoute, pathname, router]);

  React.useEffect(() => {
    if (!isMainHeader || marqueeTrackWidth <= 0) return;

    // Keep speed stable across devices (~32 px/sec).
    const duration = Math.max(12000, Math.round((marqueeTrackWidth / 32) * 1000));

    marqueeTranslateX.setValue(0);
    const loop = Animated.loop(
      Animated.timing(marqueeTranslateX, {
        toValue: -marqueeTrackWidth,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();

    return () => loop.stop();
  }, [isMainHeader, marqueeTrackWidth, marqueeTranslateX]);

  return (
    <View style={styles.container}>
      {isMainHeader ? (
        <View style={styles.marqueeStrip}>
          <Animated.View
            style={[styles.marqueeLoop, { transform: [{ translateX: marqueeTranslateX }] }]}
          >
            <View
              style={styles.marqueeTrack}
              onLayout={(event) => setMarqueeTrackWidth(event.nativeEvent.layout.width)}
            >
              {marqueeItems.map((message, index) => (
                <View key={`mq-a-${index}`} style={styles.announcementItem}>
                  <View style={styles.announcementDot} />
                  <Text style={styles.marqueeText} numberOfLines={1}>
                    {message}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.marqueeTrack}>
              {marqueeItems.map((message, index) => (
                <View key={`mq-b-${index}`} style={styles.announcementItem}>
                  <View style={styles.announcementDot} />
                  <Text style={styles.marqueeText} numberOfLines={1}>
                    {message}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </View>
      ) : null}

      <View style={styles.row}>
        <View style={[styles.leftSlot, isMainHeader && styles.mainEdgeSlot]}>
          {isMainHeader ? (
            <TouchableOpacity
              onPress={handleOpenMenu}
              style={[styles.iconButton, styles.mainHeaderIconButton]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Ionicons name="menu" size={21} color={colors.charcoal} />
            </TouchableOpacity>
          ) : shouldShowBack ? (
            <View style={styles.leftRow}>
              <Pressable onPress={handleBack} style={styles.iconButton} hitSlop={8}>
                <Ionicons name="chevron-back" size={18} color={colors.charcoal} />
              </Pressable>
            </View>
          ) : (
            <View style={styles.leftSpacer} />
          )}
        </View>

        <View style={[styles.centerSlot, isMainHeader && styles.mainCenterSlot]}>
          {isMainHeader ? (
            <Image source={images.logo} style={styles.logo} contentFit="contain" />
          ) : title ? (
            <Text style={styles.titleText} numberOfLines={1}>{title}</Text>
          ) : (
            <Image source={images.logo} style={styles.subLogo} contentFit="contain" />
          )}
        </View>

        <View style={[styles.actions, isMainHeader && styles.mainEdgeSlot]}>
          {shouldShowSearch ? (
            <Pressable
              style={[styles.iconButton, isMainHeader && styles.mainHeaderIconButton]}
              onPress={() => router.push("/search")}
            >
              <Ionicons name="search-outline" size={19} color={colors.charcoal} />
            </Pressable>
          ) : null}
          {shouldShowProfile ? (
            <Pressable
              style={[styles.iconButton, isMainHeader && styles.mainHeaderIconButton]}
              onPress={() => router.push("/profile")}
            >
              <Ionicons name="person-outline" size={21} color={colors.charcoal} />
            </Pressable>
          ) : null}
          {shouldShowWishlist ? (
            <Pressable
              style={[styles.iconButton, isMainHeader && styles.mainHeaderIconButton]}
              onPress={() => router.push("/wishlist")}
            >
              <Ionicons name="heart-outline" size={21} color={colors.charcoal} />
            </Pressable>
          ) : null}
          {shouldShowCart ? (
            <Pressable
              style={[styles.iconButton, isMainHeader && styles.mainHeaderIconButton]}
              onPress={() => router.push("/cart")}
            >
              <Ionicons name="bag-handle-outline" size={19} color={colors.charcoal} />
            </Pressable>
          ) : null}
          {shouldShowMenu && !isMainHeader ? (
            <Pressable
              style={styles.iconButton}
              onPress={handleOpenMenu}
            >
              <Ionicons name="menu" size={18} color={colors.charcoal} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <MenuSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={(route) => {
          setMenuOpen(false);
          router.push(route as any);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    shadowColor: colors.charcoal,
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
    zIndex: 10,
  },
  marqueeStrip: {
    height: 28,
    backgroundColor: colors.cream,
    overflow: "hidden",
    justifyContent: "center",
    marginBottom: spacing.xs,
    marginHorizontal: -spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  marqueeLoop: {
    flexDirection: "row",
    alignItems: "center",
  },
  marqueeTrack: {
    flexDirection: "row",
    alignItems: "center",
  },
  announcementItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 22,
  },
  announcementDot: {
    width: 5,
    height: 5,
    borderRadius: 0,
    backgroundColor: colors.gold,
    marginRight: 7,
  },
  marqueeText: {
    color: colors.brownSoft,
    fontFamily: typography.sansMedium,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    textAlign: "left",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 58,
  },
  leftSlot: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    zIndex: 50,
  },
  mainEdgeSlot: {
    flex: 0,
    width: 112,
  },
  centerSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
  mainCenterSlot: {
    flex: 1,
  },
  centerSpacer: {
    height: 1,
    width: "100%",
  },
  leftSpacer: {
    width: 38,
    height: 38,
    justifyContent: "flex-start",
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  actions: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginLeft: spacing.xs,
  },
  iconButton: {
    height: 36,
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  mainHeaderIconButton: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.warmWhite,
    zIndex: 50,
  },
  logo: {
    height: 36,
    width: 134,
    marginLeft: 0,
  },
  subLogo: {
    height: 32,
    width: 122,
  },
  titleText: {
    fontFamily: typography.serif,
    fontSize: 18,
    color: colors.foreground,
    letterSpacing: 0.3,
  },
});
