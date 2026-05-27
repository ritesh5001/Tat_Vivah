import React from "react";
import { Feather } from "@expo/vector-icons";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from "react-native";
import { colors, spacing, typography } from "../theme";
import { CachedImage } from "./CachedImage";

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
  return (
    <View style={styles.wrapper}>
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
