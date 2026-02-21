import * as React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../../src/components/AppHeader";
import { colors, radius, spacing, typography, shadow } from "../../src/theme/tokens";

export default function PrivacyPolicyScreen() {
  const handleExternalLink = React.useCallback((url: string) => {
    Linking.openURL(url);
  }, []);

  return (
    <>
      <AppHeader title="Privacy Policy" subtitle="Tatvivah Trends" showBack />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.title}>Your privacy matters</Text>
            <Text style={styles.copy}>
              Tatvivah Trends is committed to protecting your personal data and
              honoring your preferences. This policy outlines what we collect,
              how we use it, and how you can manage your information.
            </Text>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Information we collect</Text>
              <Text style={styles.copy}>
                Account details, order history, saved addresses, and support
                interactions that help us fulfill your orders and provide
                personalized recommendations.
              </Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How we use it</Text>
              <Text style={styles.copy}>
                To process transactions, improve styling recommendations, and
                keep you informed about order updates and curated edits.
              </Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your choices</Text>
              <Text style={styles.copy}>
                You can review, update, or delete your details from your profile
                at any time. For additional requests, contact our concierge.
              </Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Learn more</Text>
              <Pressable
                style={styles.linkButton}
                onPress={() => handleExternalLink("https://tatvivahtrends.com")}
              >
                <Text style={styles.linkText}>tatvivahtrends.com</Text>
              </Pressable>
            </View>
            <Text style={styles.updated}>Last updated: February 20, 2026</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  title: {
    fontFamily: typography.serif,
    fontSize: 24,
    color: colors.charcoal,
  },
  copy: {
    marginTop: spacing.sm,
    fontFamily: typography.sans,
    fontSize: 13,
    lineHeight: 20,
    color: colors.brownSoft,
  },
  section: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.charcoal,
  },
  linkButton: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.warmWhite,
  },
  linkText: {
    fontFamily: typography.sansMedium,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.charcoal,
  },
  updated: {
    marginTop: spacing.lg,
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.brownSoft,
  },
});
