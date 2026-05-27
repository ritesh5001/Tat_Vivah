import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "./AppText";

export type Audience = "MENS" | "KIDS";

interface AudienceTabsProps {
  value: Audience;
  onChange: (next: Audience) => void;
}

export function AudienceTabs({ value, onChange }: AudienceTabsProps) {
  return (
    <View style={styles.container} accessibilityRole="tablist">
      {(["MENS", "KIDS"] as const).map((opt) => {
        const active = value === opt;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.tab, active && styles.tabActive]}
          >
            <AppText style={[styles.label, active && styles.labelActive]}>
              {opt === "MENS" ? "Mens" : "Kids"}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#d8c4b1",
    backgroundColor: "#fff8f0",
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  tabActive: {
    backgroundColor: "#511d00",
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#7a5b3a",
  },
  labelActive: {
    color: "#fff8f0",
  },
});
