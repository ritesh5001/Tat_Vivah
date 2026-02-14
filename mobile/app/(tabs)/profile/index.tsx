import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors, radius, spacing, typography, shadow } from "../../../src/theme/tokens";
import { useAuth } from "../../../src/hooks/useAuth";
import { AnimatedPressable } from "../../../src/components/AnimatedPressable";

export default function ProfileScreen() {
  const router = useRouter();
  const { session, signOut, isLoading } = useAuth();
  const user = session?.user;

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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerCopy}>Manage your account.</Text>
        </View>

        {isLoading ? (
          <View style={styles.card}>
            <ActivityIndicator color={colors.gold} />
            <Text style={styles.loadingText}>Loading profile…</Text>
          </View>
        ) : !user ? (
          <View style={styles.card}>
            <Text style={styles.emptyIcon}>👤</Text>
            <Text style={styles.emptyTitle}>Not signed in</Text>
            <Text style={styles.emptySubtitle}>
              Sign in to manage your account and track your orders.
            </Text>
            <Pressable
              style={styles.primaryButton}
              onPress={() => router.replace("/login")}
            >
              <Text style={styles.primaryButtonText}>Sign in</Text>
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
                onPress={() => router.push("/(auth)/forgot-password")}
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
                  <ActivityIndicator color={colors.background} size="small" />
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

  // Cards
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

  // Avatar
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.cream,
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
    fontSize: 16,
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
    color: "#A65D57",
  },

  // Buttons
  primaryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.charcoal,
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
    backgroundColor: colors.warmWhite,
    borderRadius: radius.lg,
    padding: spacing.lg,
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
    color: colors.charcoal,
  },
  modalConfirmButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "#A65D57",
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
