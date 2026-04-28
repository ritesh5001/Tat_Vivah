import React from "react";
import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";
import { colors } from "../theme";

type ScrollToTopFabProps = {
  visible: boolean;
  onPress: () => void;
};

export function ScrollToTopFab({ visible, onPress }: ScrollToTopFabProps) {
  if (!visible) return null;

  return (
    <Pressable onPress={onPress} style={styles.fab} hitSlop={8}>
      <Feather name="arrow-up" size={20} color={colors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 18,
    bottom: 26,
    width: 48,
    height: 48,
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryAccent,
    shadowColor: "#2C2825",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 4,
    zIndex: 50,
  },
});
