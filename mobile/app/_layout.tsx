import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import {
  CormorantGaramond_300Light,
  CormorantGaramond_400Regular,
} from "@expo-google-fonts/cormorant-garamond";
import { Inter_400Regular, Inter_500Medium } from "@expo-google-fonts/inter";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_300Light,
    CormorantGaramond_400Regular,
    Inter_400Regular,
    Inter_500Medium,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#FAF7F2" },
      }}
    />
  );
}
