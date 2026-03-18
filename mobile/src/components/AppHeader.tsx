import * as React from "react";
import { View, Text, StyleSheet, Pressable, Animated, Easing } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, shadow } from "../theme/tokens";
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

const MARQUEE_MESSAGES = [
  "TatVivah delivers premium groomwear that looks rich in photos and feels easy all day.",
  "From haldi to reception, find complete curated looks in one seamless shopping flow.",
  "Trusted by wedding shoppers for reliable delivery, sharp fits, and elegant finishing.",
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
  const [marqueeStripWidth, setMarqueeStripWidth] = React.useState(0);
  const [marqueeContentWidth, setMarqueeContentWidth] = React.useState(0);
  const marqueeTranslateX = React.useRef(new Animated.Value(0)).current;

  const isMainHeader = variant === "main";
  const shouldShowBack = isMainHeader ? false : (showBack ?? pathname !== "/home");
  const shouldShowMenu = showMenu ?? true;
  const shouldShowSearch = showSearch ?? isMainHeader;
  const shouldShowProfile = showProfile ?? isMainHeader;
  const shouldShowWishlist = showWishlist ?? isMainHeader;
  const shouldShowCart = showCart ?? isMainHeader;
  const marqueeItems = React.useMemo(
    () => [...MARQUEE_MESSAGES, ...MARQUEE_MESSAGES],
    []
  );

  const handleBack = React.useCallback(() => {
    if (pathname === "/home") {
      router.push("/home");
      return;
    }
    router.back();
  }, [pathname, router]);

  React.useEffect(() => {
    if (!isMainHeader || marqueeStripWidth <= 0 || marqueeContentWidth <= 0) return;

    const singleSetWidth = marqueeContentWidth / 2;
    const distance = marqueeStripWidth + singleSetWidth;
    const duration = Math.max(3600, Math.round((distance / 220) * 1000));

    marqueeTranslateX.setValue(marqueeStripWidth);
    const loop = Animated.loop(
      Animated.timing(marqueeTranslateX, {
        toValue: -singleSetWidth,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();

    return () => loop.stop();
  }, [isMainHeader, marqueeContentWidth, marqueeStripWidth, marqueeTranslateX]);

  return (
    <View style={styles.container}>
      {isMainHeader ? (
        <View
          style={styles.marqueeStrip}
          onLayout={(event) => setMarqueeStripWidth(event.nativeEvent.layout.width)}
        >
          <Animated.View
            style={[styles.marqueeTrack, { transform: [{ translateX: marqueeTranslateX }] }]}
            onLayout={(event) => setMarqueeContentWidth(event.nativeEvent.layout.width)}
          >
            {marqueeItems.map((message, index) => (
              <Text key={`mq-${index}`} style={styles.marqueeText} numberOfLines={1}>
                {message}
                {"   •   "}
              </Text>
            ))}
          </Animated.View>
        </View>
      ) : null}

      <View style={styles.row}>
        <View style={[styles.leftSlot, isMainHeader && styles.mainEdgeSlot]}>
          {isMainHeader ? (
            <Pressable
              onPress={() => setMenuOpen(true)}
              style={styles.iconButton}
              hitSlop={8}
            >
              <Ionicons name="menu" size={25} color={colors.charcoal} />
            </Pressable>
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
              style={styles.iconButton}
              onPress={() => router.push("/search")}
            >
              <Ionicons name="search-outline" size={21} color={colors.charcoal} />
            </Pressable>
          ) : null}
          {shouldShowProfile ? (
            <Pressable
              style={styles.iconButton}
              onPress={() => router.push("/profile")}
            >
              <Ionicons name="person-outline" size={21} color={colors.charcoal} />
            </Pressable>
          ) : null}
          {shouldShowWishlist ? (
            <Pressable
              style={styles.iconButton}
              onPress={() => router.push("/wishlist")}
            >
              <Ionicons name="heart-outline" size={21} color={colors.charcoal} />
            </Pressable>
          ) : null}
          {shouldShowCart ? (
            <Pressable
              style={styles.iconButton}
              onPress={() => router.push("/cart")}
            >
              <Ionicons name="bag-outline" size={20} color={colors.charcoal} />
            </Pressable>
          ) : null}
          {shouldShowMenu && !isMainHeader ? (
            <Pressable
              style={styles.iconButton}
              onPress={() => setMenuOpen(true)}
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
    backgroundColor: "#f8ecd7",
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
    ...shadow.card,
  },
  marqueeStrip: {
    height: 36,
    backgroundColor: "#511d00",
    overflow: "hidden",
    justifyContent: "center",
    marginBottom: spacing.xs,
    marginHorizontal: -spacing.sm,
  },
  marqueeTrack: {
    flexDirection: "row",
    alignItems: "center",
  },
  marqueeText: {
    color: "#FFFFFF",
    fontFamily: typography.sansMedium,
    fontSize: 13,
    letterSpacing: 0.1,
    textAlign: "left",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 20,
  },
  leftSlot: {
    flex: 1,
    justifyContent: "flex-start",
  },
  mainEdgeSlot: {
    flex: 0,
    width: 146,
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
    gap: spacing.md,
    marginLeft: spacing.xs,
  },
  iconButton: {
    height: 28,
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    height: 34,
    width: 136,
    marginLeft: -100,
  },
  subLogo: {
    height: 28,
    width: 112,
  },
  titleText: {
    fontFamily: typography.serif,
    fontSize: 18,
    color: colors.charcoal,
    letterSpacing: 0.3,
  },
});
