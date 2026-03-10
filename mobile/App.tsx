import { useFonts } from "expo-font";
import {
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import { Inter_400Regular, Inter_500Medium } from "@expo-google-fonts/inter";
import { View, Text, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { AppProviders } from "./src/providers/AppProviders";
import { colors, typography } from "./src/theme";

export default function App() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    Inter_500Medium,
  });

  if (!fontsLoaded) {
    return (
      <AppProviders>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading TatVivah...</Text>
        </View>
      </AppProviders>
    );
  }

  return (
    <AppProviders>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AppProviders>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 14,
    letterSpacing: 1.2,
    fontFamily: typography.body,
    color: colors.textPrimary,
  },
});
