import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors, spacing, typography } from "../../src/theme";
import { requestOtp } from "../../src/services/auth";
import { useAuth } from "../../src/hooks/useAuth";
import {
  AppInput as TextInput,
  AppText as Text,
  ScreenContainer as SafeAreaView,
} from "../../src/components";

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const { signInWithOtp } = useAuth();
  const [otp, setOtp] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const handleVerify = React.useCallback(async () => {
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const code = otp.trim();

    if (!normalizedEmail) {
      setError("Missing email. Please request OTP again.");
      return;
    }
    if (code.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const responseMessage = await signInWithOtp({ email: normalizedEmail, otp: code });
      if (responseMessage) {
        setMessage(responseMessage);
        return;
      }
      router.replace("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setLoading(false);
    }
  }, [email, otp, signInWithOtp, router]);

  const handleResend = React.useCallback(async () => {
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!normalizedEmail) {
      setError("Missing email. Please request OTP again.");
      return;
    }

    setResending(true);
    setError(null);
    setMessage(null);
    try {
      const result = await requestOtp({ email: normalizedEmail });
      setMessage(result.message || "OTP sent again.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend OTP");
    } finally {
      setResending(false);
    }
  }, [email]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.heading}>VERIFY OTP</Text>
        <Text style={styles.subHeading}>Enter the 6-digit code sent to your email</Text>

        <TextInput
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="Enter OTP"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {message ? <Text style={styles.infoText}>{message}</Text> : null}

        <Pressable style={styles.continueButton} onPress={handleVerify} disabled={loading}>
          <Text style={styles.continueText}>{loading ? "VERIFYING..." : "CONTINUE"}</Text>
        </Pressable>

        <Pressable style={styles.resendRow} onPress={handleResend} disabled={resending}>
          <Text style={styles.resendText}>{resending ? "Resending..." : "Resend OTP"}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl,
  },
  heading: {
    fontFamily: typography.heading,
    fontSize: 30,
    color: colors.textPrimary,
    textAlign: "center",
  },
  subHeading: {
    marginTop: spacing.sm,
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.white,
    textAlign: "center",
    letterSpacing: 5,
  },
  continueButton: {
    marginTop: spacing.lg,
    width: "100%",
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryAccent,
  },
  continueText: {
    color: colors.white,
    fontFamily: typography.bodyMedium,
    letterSpacing: 1,
    fontSize: 13,
  },
  errorText: {
    marginTop: spacing.sm,
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.primaryAccent,
    textAlign: "center",
  },
  infoText: {
    marginTop: spacing.sm,
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.textPrimary,
    textAlign: "center",
  },
  resendRow: {
    marginTop: spacing.md,
    alignItems: "center",
  },
  resendText: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.primaryAccent,
  },
});
