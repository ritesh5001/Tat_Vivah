import * as React from "react";
import { View, Text, StyleSheet, TextInput, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { type NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, radius, spacing, typography, shadow } from "../theme/tokens";
import { type RootStackParamList } from "../navigation/types";

export function CreateAccountScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>Create account</Text>
        <Text style={styles.title}>Join TatVivah</Text>
        <Text style={styles.copy}>
          Unlock curated collections, premium support, and exclusive drops.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Full name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.brownSoft}
            style={styles.input}
          />

          <Text style={[styles.label, styles.labelSpacing]}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.brownSoft}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />

          <Text style={[styles.label, styles.labelSpacing]}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Create a password"
            placeholderTextColor={colors.brownSoft}
            secureTextEntry
            style={styles.input}
          />

          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Create account</Text>
          </Pressable>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Pressable onPress={() => navigation.navigate("Login")}
            style={styles.footerLinkButton}
          >
            <Text style={styles.footerLinkText}>Sign in</Text>
          </Pressable>
        </View>
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
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  eyebrow: {
    fontFamily: typography.sans,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.gold,
  },
  title: {
    fontFamily: typography.serif,
    fontSize: 28,
    color: colors.charcoal,
  },
  copy: {
    fontFamily: typography.sans,
    fontSize: 13,
    lineHeight: 19,
    color: colors.brownSoft,
  },
  card: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
    gap: spacing.sm,
  },
  label: {
    fontFamily: typography.sans,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.brownSoft,
  },
  labelSpacing: {
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontFamily: typography.sans,
    color: colors.charcoal,
    backgroundColor: colors.background,
  },
  primaryButton: {
    marginTop: spacing.md,
    backgroundColor: colors.charcoal,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: "center",
  },
  primaryButtonText: {
    fontFamily: typography.serif,
    fontSize: 13,
    letterSpacing: 1,
    color: colors.background,
  },
  footerRow: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerText: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
  },
  footerLinkButton: {
    paddingVertical: 4,
  },
  footerLinkText: {
    fontFamily: typography.serif,
    fontSize: 13,
    color: colors.charcoal,
  },
});
