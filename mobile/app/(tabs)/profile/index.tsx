import * as React from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography, shadow } from "../../../src/theme/tokens";
import { useAuth } from "../../../src/hooks/useAuth";
import { AnimatedPressable } from "../../../src/components/AnimatedPressable";
import { AppHeader } from "../../../src/components/AppHeader";
import { TatvivahLoader } from "../../../src/components/TatvivahLoader";
import { AppText as Text, ScreenContainer as SafeAreaView } from "../../../src/components";

export default function ProfileScreen() {
  const router = useRouter();
  const { session, signOut, isLoading } = useAuth();
  const user = session?.user;
  const displayName = React.useMemo(() => {
    if (!user) return "TatVivah User";
    if (user.fullName?.trim()) return user.fullName.trim();
    if (user.email) return user.email.split("@")[0];
    return "TatVivah User";
  }, [user]);

  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

  const mountedRef = React.useRef(true);
  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);


  const handleLogout = React.useCallback(async () => {
    setLoggingOut(true);
    try {
      await signOut();
      if (mountedRef.current) {
        setShowLogoutModal(false);
        router.replace("/login");
      }
    } finally {
      if (mountedRef.current) setLoggingOut(false);
    }
  }, [signOut, router]);

  const openLogoutModal = React.useCallback(() => {
    setShowLogoutModal(true);
  }, []);

  const closeLogoutModal = React.useCallback(() => {
    setShowLogoutModal(false);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader variant="main" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerCopy}>Manage your account.</Text>
        </View>

        {isLoading ? (
          <View style={styles.card}>
            <TatvivahLoader label="Loading profile" color={colors.gold} />
          </View>
        ) : !user ? (
          <View style={styles.card}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="person" size={30} color={colors.brown} />
            </View>
            <Text style={styles.emptyTitle}>Sign in to view profile</Text>
            <Text style={styles.emptySubtitle}>
              Manage addresses, orders, and account settings after login.
            </Text>
            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push("/login?returnTo=%2Fprofile")}
            >
              <Text style={styles.primaryButtonText}>Sign in</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => router.push("/home")}
            >
              <Text style={styles.secondaryButtonText}>Back to home</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* User info card */}
            <View style={styles.card}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {(user.email ?? user.phone ?? "U").charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.label}>Name</Text>
                <Text style={styles.value}>{displayName}</Text>
                {user.email && (
                  <>
                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.value}>{user.email}</Text>
                  </>
                )}
                {user.phone && (
                  <>
                    <Text style={styles.label}>Phone</Text>
                    <Text style={styles.value}>{user.phone}</Text>
                  </>
                )}
                <Text style={styles.label}>Account type</Text>
                <Text style={styles.value}>{user.role ?? "USER"}</Text>
                <Text style={styles.label}>Account status</Text>
                <Text style={styles.value}>{user.status ?? "ACTIVE"}</Text>
                {user.isEmailVerified != null && (
                  <>
                    <Text style={styles.label}>Email verified</Text>
                    <Text style={styles.value}>
                      {user.isEmailVerified ? "Yes ✓" : "No"}
                    </Text>
                  </>
                )}
                {user.isPhoneVerified != null && (
                  <>
                    <Text style={styles.label}>Phone verified</Text>
                    <Text style={styles.value}>
                      {user.isPhoneVerified ? "Yes ✓" : "No"}
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* Actions card */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Account Actions</Text>

              <AnimatedPressable
                style={styles.actionRow}
                onPress={() => router.push("/profile/addresses")}
              >
                <Text style={styles.actionText}>Manage Addresses</Text>
                <Text style={styles.actionChevron}>→</Text>
              </AnimatedPressable>

              <AnimatedPressable
                style={styles.actionRow}
                onPress={() => router.push("/forgot-password")}
              >
                <Text style={styles.actionText}>Reset Password</Text>
                <Text style={styles.actionChevron}>→</Text>
              </AnimatedPressable>

              <AnimatedPressable
                style={styles.actionRow}
                onPress={() => router.push("/orders")}
              >
                <Text style={styles.actionText}>My Orders</Text>
                <Text style={styles.actionChevron}>→</Text>
              </AnimatedPressable>

              <AnimatedPressable
                style={[styles.actionRow, styles.actionRowLast]}
                onPress={openLogoutModal}
              >
                <Text style={[styles.actionText, styles.dangerText]}>
                  Sign Out
                </Text>
                <Text style={[styles.actionChevron, styles.dangerText]}>→</Text>
              </AnimatedPressable>
            </View>
          </>
        )}
      </ScrollView>

      {/* Logout confirmation modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={closeLogoutModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to sign out? You'll need to sign in again to
              access your account.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={closeLogoutModal}
                disabled={loggingOut}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <AnimatedPressable
                style={[
                  styles.modalConfirmButton,
                  loggingOut && styles.buttonDisabled,
                ]}
                onPress={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? (
                  <TatvivahLoader size="sm" color={colors.background} />
                ) : (
                  <Text style={styles.modalConfirmText}>Sign Out</Text>
                )}
              </AnimatedPressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
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
    lineHeight: 18,
  },

  // Cards
  card: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },

  // Avatar
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  avatarText: {
    fontFamily: typography.serif,
    fontSize: 24,
    color: colors.gold,
  },
  emptyIconWrap: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 1.5,
    borderColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9EFE2",
    alignSelf: "center",
  },

  // Info
  infoSection: {
    gap: 2,
  },
  label: {
    fontFamily: typography.sans,
    fontSize: 10,
    color: colors.brownSoft,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginTop: spacing.sm,
  },
  value: {
    fontFamily: typography.sansMedium,
    fontSize: 14,
    color: colors.charcoal,
    marginTop: 2,
  },

  // Section title
  sectionTitle: {
    fontFamily: typography.serif,
    fontSize: 18,
    color: colors.charcoal,
    marginBottom: spacing.sm,
  },

  // Action rows
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSoft,
  },
  actionRowLast: {
    borderBottomWidth: 0,
  },
  actionText: {
    fontFamily: typography.sans,
    fontSize: 14,
    color: colors.charcoal,
  },
  actionChevron: {
    fontFamily: typography.sans,
    fontSize: 16,
    color: colors.brownSoft,
  },
  dangerText: {
    color: colors.gold,
  },

  // Buttons
  primaryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.gold,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.background,
  },
  secondaryButton: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.foreground,
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  // Empty / loading
  loadingText: {
    marginTop: spacing.sm,
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
    textAlign: "center",
  },
  emptyIcon: {
    fontSize: 40,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: typography.serif,
    fontSize: 18,
    color: colors.charcoal,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
    textAlign: "center",
    lineHeight: 18,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  modalTitle: {
    fontFamily: typography.serif,
    fontSize: 20,
    color: colors.charcoal,
  },
  modalMessage: {
    marginTop: spacing.sm,
    fontFamily: typography.sans,
    fontSize: 13,
    color: colors.brownSoft,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  modalCancelButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  modalCancelText: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.foreground,
  },
  modalConfirmButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    minWidth: 90,
    alignItems: "center",
  },
  modalConfirmText: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.background,
  },
});
