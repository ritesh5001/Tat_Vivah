import * as React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  colors,
  radius,
  spacing,
  typography,
  shadow,
} from "../../src/theme/tokens";
import { resetPassword, forgotPassword } from "../../src/services/auth";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [digits, setDigits] = React.useState<string[]>(
    Array(OTP_LENGTH).fill("")
  );
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [countdown, setCountdown] = React.useState(RESEND_COOLDOWN_SECONDS);

  const inputRefs = React.useRef<(TextInput | null)[]>([]);
  const passwordRef = React.useRef<TextInput>(null);

  // ---------- Countdown timer ----------
  React.useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // ---------- Auto-focus first OTP field ----------
  React.useEffect(() => {
    const timer = setTimeout(() => inputRefs.current[0]?.focus(), 350);
    return () => clearTimeout(timer);
  }, []);

  // ---------- OTP input handlers ----------
  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    } else if (digit && index === OTP_LENGTH - 1) {
      // Last digit filled → move to password
      passwordRef.current?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setDigits((prev) => {
        const next = [...prev];
        next[index - 1] = "";
        return next;
      });
    }
  };

  const handlePaste = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, OTP_LENGTH).split("");
      setDigits((prev) => {
        const next = [...prev];
        chars.forEach((ch, i) => {
          if (index + i < OTP_LENGTH) next[index + i] = ch;
        });
        return next;
      });
      const focusIdx = Math.min(index + chars.length, OTP_LENGTH - 1);
      if (index + chars.length >= OTP_LENGTH) {
        passwordRef.current?.focus();
      } else {
        inputRefs.current[focusIdx]?.focus();
      }
      return true;
    }
    return false;
  };

  // ---------- Submit ----------
  const handleSubmit = async () => {
    if (!email) {
      setError("Missing email. Please go back and try again.");
      return;
    }

    const otp = digits.join("");
    if (otp.length !== OTP_LENGTH) {
      setError("Please enter the full 6-digit OTP.");
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await resetPassword({ email, otp, newPassword });
      setSuccess(result.message);
      // Navigate to login after short delay
      setTimeout(() => router.replace("/(auth)/login"), 1500);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Password reset failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Resend ----------
  const handleResend = async () => {
    if (countdown > 0 || !email) return;
    setError(null);
    try {
      await forgotPassword({ email });
      setCountdown(RESEND_COOLDOWN_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to resend OTP";
      setError(message);
    }
  };

  const otpComplete = digits.every((d) => d !== "");

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Logo row */}
        <View style={styles.logoRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoLetter}>T</Text>
          </View>
          <View>
            <Text style={styles.brand}>TatVivah</Text>
            <Text style={styles.brandTag}>Premium Indian Fashion</Text>
          </View>
        </View>

        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{" "}
          <Text style={styles.emailHighlight}>{email ?? "your email"}</Text>
          {" "}and set a new password.
        </Text>

        <View style={styles.card}>
          {/* OTP digits */}
          <Text style={styles.label}>OTP Code</Text>
          <View style={styles.otpRow}>
            {digits.map((digit, i) => (
              <TextInput
                key={i}
                ref={(ref) => {
                  inputRefs.current[i] = ref;
                }}
                style={[
                  styles.otpInput,
                  digit ? styles.otpInputFilled : null,
                ]}
                value={digit}
                onChangeText={(text) => {
                  if (!handlePaste(text, i)) {
                    handleChange(text, i);
                  }
                }}
                onKeyPress={(e) => handleKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!loading}
              />
            ))}
          </View>

          {/* New password */}
          <Text style={styles.label}>New Password</Text>
          <TextInput
            ref={passwordRef}
            placeholder="Min 8 characters"
            placeholderTextColor={colors.brownSoft}
            secureTextEntry
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            editable={!loading}
            autoComplete="new-password"
          />

          {/* Confirm password */}
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            placeholder="Re-enter password"
            placeholderTextColor={colors.brownSoft}
            secureTextEntry
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!loading}
            autoComplete="new-password"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {success ? <Text style={styles.successText}>{success}</Text> : null}

          <Pressable
            style={[
              styles.primaryButton,
              (loading || !otpComplete) && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading || !otpComplete}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? "Resetting…" : "Reset Password"}
            </Text>
          </Pressable>

          {/* Resend row */}
          <View style={styles.resendRow}>
            {countdown > 0 ? (
              <Text style={styles.resendTimer}>
                Resend code in {countdown}s
              </Text>
            ) : (
              <Pressable onPress={handleResend}>
                <Text style={styles.resendLink}>Resend code</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Wrong email?</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.footerLink}>Go back</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  logoBadge: {
    height: 44,
    width: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  logoLetter: {
    fontFamily: typography.serif,
    fontSize: 20,
    color: colors.charcoal,
  },
  brand: {
    fontFamily: typography.serif,
    fontSize: 18,
    color: colors.charcoal,
  },
  brandTag: {
    fontFamily: typography.sans,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.brownSoft,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: typography.serif,
    fontSize: 28,
    color: colors.charcoal,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontFamily: typography.sans,
    fontSize: 14,
    color: colors.brownSoft,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  emailHighlight: {
    fontFamily: typography.sansMedium,
    color: colors.charcoal,
  },
  card: {
    backgroundColor: colors.warmWhite,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  label: {
    fontFamily: typography.sansMedium,
    fontSize: 11,
    color: colors.brown,
    textTransform: "uppercase",
    letterSpacing: 1.6,
    marginBottom: spacing.xs,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  otpInput: {
    width: 46,
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    textAlign: "center",
    fontFamily: typography.sansMedium,
    fontSize: 22,
    color: colors.charcoal,
    backgroundColor: colors.background,
  },
  otpInputFilled: {
    borderColor: colors.gold,
    backgroundColor: colors.warmWhite,
  },
  input: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.md,
    fontFamily: typography.sans,
    color: colors.charcoal,
    marginBottom: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.charcoal,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.background,
  },
  errorText: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: "#A65D57",
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  successText: {
    fontFamily: typography.sans,
    fontSize: 13,
    color: colors.gold,
    marginBottom: spacing.sm,
    textAlign: "center",
    lineHeight: 19,
  },
  resendRow: {
    marginTop: spacing.md,
    alignItems: "center",
  },
  resendTimer: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
  },
  resendLink: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    color: colors.gold,
  },
  footerRow: {
    marginTop: spacing.xl,
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xs,
  },
  footerText: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
  },
  footerLink: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    color: colors.gold,
  },
});
