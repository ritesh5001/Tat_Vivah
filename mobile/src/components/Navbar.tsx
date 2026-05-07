import React, { useEffect, useMemo, useState } from "react";
import { Feather } from "@expo/vector-icons";
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { colors, spacing, typography } from "../theme";
import { CachedImage } from "./CachedImage";

const ANNOUNCEMENT_MESSAGES = [
  "Enjoy hassle-free returns and exchanges",
  "Free shipping across India",
  "New menswear drops every week",
  "Trusted by 10,000+ grooms",
] as const;

type NavbarProps = {
  onHamburgerPress?: () => void;
  onSearchPress?: () => void;
  onProfilePress?: () => void;
  onWishlistPress?: () => void;
  onCartPress?: () => void;
  profileNotificationCount?: number;
  logoSource?: ImageSourcePropType;
};

export function Navbar({
  onHamburgerPress,
  onSearchPress,
  onProfilePress,
  onWishlistPress,
  onCartPress,
  profileNotificationCount = 0,
  logoSource,
}: NavbarProps) {
  const [contentWidth, setContentWidth] = useState(0);
  const translateX = useSharedValue(0);

  const marqueeText = useMemo(() => {
    const chunk = `  •  ${ANNOUNCEMENT_MESSAGES.join("  •  ")}  `;
    return `${chunk}${chunk}`;
  }, []);

  useEffect(() => {
    if (contentWidth <= 0) {
      return;
    }

    translateX.value = 0;
    translateX.value = withRepeat(
      withTiming(-contentWidth / 2, {
        duration: 16000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [contentWidth, translateX]);

  const marqueeAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const handleContentLayout = (event: LayoutChangeEvent) => {
    setContentWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.announcementBar}>
        <View style={styles.marqueeViewport}>
          <Animated.View style={[styles.marqueeTrack, marqueeAnimatedStyle]} onLayout={handleContentLayout}>
            <Text numberOfLines={1} style={styles.announcementText}>
              {marqueeText}
            </Text>
          </Animated.View>
        </View>
      </View>

      <View style={styles.mainBar}>
        <Pressable onPress={onHamburgerPress} style={styles.iconButton} hitSlop={8}>
          <Feather name="menu" size={22} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.logoContainer}>
          <CachedImage
            source={logoSource ?? require("../../public/logo.png")}
            style={styles.logoImage}
            contentFit="contain"
          />
        </View>

        <View style={styles.actionsContainer}>
          <Pressable onPress={onSearchPress} style={styles.iconButton} hitSlop={8}>
            <Feather name="search" size={20} color={colors.textPrimary} />
          </Pressable>

          <Pressable onPress={onProfilePress} style={styles.iconButton} hitSlop={8}>
            <Feather name="user" size={20} color={colors.textPrimary} />
            {profileNotificationCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{profileNotificationCount}</Text>
              </View>
            ) : null}
          </Pressable>

          <Pressable onPress={onWishlistPress} style={styles.iconButton} hitSlop={8}>
            <Feather name="heart" size={20} color={colors.textPrimary} />
          </Pressable>

          <Pressable onPress={onCartPress} style={styles.iconButton} hitSlop={8}>
            <Feather name="shopping-bag" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.navbarBackground,
  },
  announcementBar: {
    height: 32,
    backgroundColor: colors.headerBrown,
    justifyContent: "center",
  },
  marqueeViewport: {
    overflow: "hidden",
  },
  marqueeTrack: {
    alignSelf: "flex-start",
  },
  announcementText: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.white,
    includeFontPadding: false,
  },
  mainBar: {
    height: 60,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
  },
  iconButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontFamily: typography.heading,
    fontSize: 22,
    color: colors.headerBrown,
  },
  logoImage: {
    width: 118,
    height: 34,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  badge: {
    position: "absolute",
    right: -2,
    top: -1,
    minWidth: 14,
    height: 14,
    borderRadius: 0,
    paddingHorizontal: 3,
    backgroundColor: colors.primaryAccent,
    borderWidth: 1,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontFamily: typography.bodyMedium,
    fontSize: 9,
    color: colors.white,
    lineHeight: 10,
  },
});
