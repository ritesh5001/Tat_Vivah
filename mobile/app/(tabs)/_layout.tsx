import { Stack } from "expo-router";
import { colors } from "../../src/theme/tokens";

export default function TabsLayout() {
  return (
    <Stack
      initialRouteName="home/index"
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="home/index" />
      <Stack.Screen name="marketplace/index" />
      <Stack.Screen name="search/index" />
      <Stack.Screen name="cart/index" />
      <Stack.Screen name="wishlist/index" />
      <Stack.Screen name="orders/index" />
      <Stack.Screen name="notifications/index" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="privacy-policy" />
      <Stack.Screen name="return-policy" />
      <Stack.Screen name="refund-policy" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="contact" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
