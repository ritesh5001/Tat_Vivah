import * as React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePathname, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography, shadow } from "../theme/tokens";
import { images } from "../data/images";
import { MenuSheet } from "./MenuSheet";
import { Image } from "./CompatImage";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showMenu?: boolean;
  showSearch?: boolean;
  showCart?: boolean;
  showHome?: boolean;
}

export function AppHeader({
  title,
  subtitle,
  showBack,
  showMenu = true,
  showSearch = false,
  showCart = false,
  showHome = false,
}: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const shouldShowBack = showBack ?? pathname !== "/home";

  const handleBack = React.useCallback(() => {
    if (pathname === "/home") {
      router.push("/home");
      return;
    }
    router.back();
  }, [pathname, router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        <View style={styles.leftSlot}>
          {shouldShowBack ? (
            <View style={styles.leftRow}>
              <Pressable onPress={handleBack} style={styles.iconButton} hitSlop={8}>
                <Ionicons name="chevron-back" size={18} color={colors.charcoal} />
              </Pressable>
            </View>
          ) : (
            <View style={styles.brandWrap}>
              <Image source={images.logo} style={styles.logo} contentFit="contain" />
              <Text style={styles.brandText} numberOfLines={1}>TatVivah</Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          {showHome ? (
            <Pressable
              style={styles.iconButton}
              onPress={() => router.push("/home")}
            >
              <Ionicons name="home-outline" size={18} color={colors.charcoal} />
            </Pressable>
          ) : null}
          {showSearch ? (
            <Pressable
              style={styles.iconButton}
              onPress={() => router.push("/search")}
            >
              <Ionicons name="search-outline" size={18} color={colors.charcoal} />
            </Pressable>
          ) : null}
          {showCart ? (
            <Pressable
              style={styles.iconButton}
              onPress={() => router.push("/cart")}
            >
              <Ionicons name="bag-outline" size={18} color={colors.charcoal} />
            </Pressable>
          ) : null}
          {showMenu ? (
            <Pressable
              style={styles.iconButton}
              onPress={() => setMenuOpen(true)}
            >
              <Ionicons name="menu" size={18} color={colors.charcoal} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {(title || subtitle) ? (
        <View style={styles.metaBlock}>
          {title ? <Text style={styles.metaTitle}>{title}</Text> : null}
          {subtitle ? <Text style={styles.metaSubtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}

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
    backgroundColor: colors.warmWhite,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    ...shadow.card,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 52,
  },
  leftSlot: {
    flex: 1,
    maxWidth: "45%",
    justifyContent: "flex-start",
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  actions: {
    flex: 0,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.xs,
    marginLeft: spacing.sm,
  },
  iconButton: {
    height: 38,
    width: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cream,
  },
  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    maxWidth: "100%",
  },
  logo: {
    height: 30,
    width: 30,
  },
  brandText: {
    fontFamily: typography.serif,
    fontSize: 20,
    color: colors.gold,
  },
  metaBlock: {
    marginTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  metaTitle: {
    fontFamily: typography.serif,
    fontSize: 20,
    color: colors.charcoal,
  },
  metaSubtitle: {
    marginTop: 2,
    fontFamily: typography.sans,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.3,
    color: colors.brownSoft,
  },
});
