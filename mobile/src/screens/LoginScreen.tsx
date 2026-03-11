import React from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { colors, typography } from "../theme";

export function LoginScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Sign In / Sign Up</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: {
    fontFamily: typography.heading,
    fontSize: typography.sizes.sectionTitle,
    color: colors.textPrimary,
  },
});
