import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import { colors, typography, spacing, radius } from "../theme/tokens";

/**
 * A blocking modal displayed when the refresh-token rotation fails
 * (i.e. the user's session is truly expired on the server).
 *
 * The user MUST tap "Sign In" → we clear the expired flag and
 * navigate to the login screen.
 */
export function SessionExpiredModal() {
  const { sessionExpired, acknowledgeSessionExpired } = useAuth();
  const router = useRouter();

  const handlePress = () => {
    acknowledgeSessionExpired();
    router.replace("/(auth)/login");
  };

  return (
    <Modal
      visible={sessionExpired}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handlePress}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Session Expired</Text>
          <Text style={styles.body}>
            Your session has expired. Please sign in again to continue.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={handlePress}
          >
            <Text style={styles.buttonText}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(44, 40, 37, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: colors.warmWhite,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: colors.charcoal,
        shadowOpacity: 0.18,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 24,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  title: {
    fontFamily: typography.serif,
    fontSize: 24,
    color: colors.charcoal,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  body: {
    fontFamily: typography.sans,
    fontSize: 15,
    color: colors.brownSoft,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.gold,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    width: "100%",
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontFamily: typography.sansMedium,
    fontSize: 16,
    color: colors.warmWhite,
    letterSpacing: 0.3,
  },
});
