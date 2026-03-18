import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, textStyles } from "../theme";

export function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <Text style={[textStyles.sectionTitle, styles.title]}>TatVivah</Text>
        <Text style={[textStyles.bodyText, styles.subtitle]}>App is running. Re-enabling sections safely.</Text>
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
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: 8,
  },
});
