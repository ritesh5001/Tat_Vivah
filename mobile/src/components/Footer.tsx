import React from "react";
import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, spacing, typography, textStyles } from "../theme";

const accordionSections = ["CATEGORIES", "SUPPORT", "QUICK LINKS", "OUR POLICIES"] as const;

export function Footer() {
  const [email, setEmail] = React.useState("");
  const [openSection, setOpenSection] = React.useState<string | null>(null);

  return (
    <View style={styles.footer}>
      <Text style={styles.footerTitle}>STAY UPDATED</Text>
      <View style={styles.newsletterRow}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email Address"
          placeholderTextColor="#C7B5AD"
          keyboardType="email-address"
          style={styles.newsletterInput}
        />
        <Pressable style={styles.newsletterArrowButton}>
          <Feather name="arrow-right" size={18} color={colors.white} />
        </Pressable>
      </View>

      <View style={styles.accordionWrap}>
        {accordionSections.map((section) => {
          const isOpen = openSection === section;
          return (
            <View key={section}>
              <Pressable
                style={styles.accordionRow}
                onPress={() => setOpenSection(isOpen ? null : section)}
              >
                <Text style={styles.accordionTitle}>{section}</Text>
                <Feather name={isOpen ? "minus" : "plus"} size={16} color={colors.white} />
              </Pressable>
              {isOpen && (
                <View style={styles.accordionContent}>
                  <Text style={styles.accordionText}>Explore {section.toLowerCase()} for TatVivah Men.</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.contactBlock}>
        <Text style={styles.contactText}>TatVivah Menswear</Text>
        <Text style={styles.contactText}>+91 98765 43210</Text>
        <Text style={styles.contactText}>support@tatvivah.com</Text>
        <Text style={styles.contactText}>Mon-Sat, 10:00 AM - 7:00 PM</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    marginTop: spacing.xl,
    backgroundColor: colors.headerBrown,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  footerTitle: {
    fontFamily: typography.heading,
    fontSize: 18,
    color: colors.white,
    letterSpacing: 0.7,
  },
  newsletterRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#9D7B70",
    borderRadius: 999,
    overflow: "hidden",
    alignItems: "center",
    backgroundColor: "#6A3422",
  },
  newsletterInput: {
    flex: 1,
    color: colors.white,
    fontFamily: typography.body,
    fontSize: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: 11,
  },
  newsletterArrowButton: {
    width: 42,
    height: 42,
    borderLeftWidth: 1,
    borderLeftColor: "#9D7B70",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7A3B27",
  },
  accordionWrap: {
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  accordionRow: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#7F5548",
    paddingVertical: spacing.sm,
  },
  accordionTitle: {
    ...textStyles.bodyText,
    color: colors.white,
    fontFamily: typography.bodyMedium,
    letterSpacing: 0.5,
  },
  accordionContent: {
    paddingVertical: spacing.sm,
  },
  accordionText: {
    ...textStyles.bodyText,
    color: "#EAD7D0",
  },
  contactBlock: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#7F5548",
    gap: 4,
  },
  contactText: {
    fontFamily: typography.body,
    fontSize: 13,
    color: "#F5E6E1",
  },
});
