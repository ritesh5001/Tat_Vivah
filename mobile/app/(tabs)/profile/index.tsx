import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors, radius, spacing, typography, shadow } from "../../../src/theme/tokens";
import { useAuth } from "../../../src/hooks/useAuth";

export default function ProfileScreen() {
  const router = useRouter();
  const { session, signOut, isLoading } = useAuth();
  const user = session?.user;

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Text style={styles.headerCopy}>Manage your account.</Text>
      </View>

      <View style={styles.card}>
        {isLoading ? (
          <Text style={styles.value}>Loading profile...</Text>
        ) : !user ? (
          <>
            <Text style={styles.value}>Sign in to manage your account.</Text>
            <Pressable
              style={styles.primaryButton}
              onPress={() => router.replace("/login")}
            >
              <Text style={styles.primaryButtonText}>Sign in</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{user.email ?? user.phone ?? "User"}</Text>

            <Text style={styles.label}>Role</Text>
            <Text style={styles.value}>{user.role ?? "USER"}</Text>

            <Pressable style={styles.primaryButton} onPress={handleLogout}>
              <Text style={styles.primaryButtonText}>Sign out</Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  headerTitle: {
    fontFamily: typography.serif,
    fontSize: 24,
    color: colors.charcoal,
  },
  headerCopy: {
    marginTop: spacing.xs,
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
  },
  card: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  label: {
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.brownSoft,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginTop: spacing.sm,
  },
  value: {
    marginTop: spacing.xs,
    fontFamily: typography.sansMedium,
    fontSize: 14,
    color: colors.charcoal,
  },
  primaryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.charcoal,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  primaryButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.background,
  },
});
