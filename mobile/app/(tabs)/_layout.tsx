import { Stack } from "expo-router";

export default function TabsLayout() {
  return (
    <Stack
      initialRouteName="home/index"
      screenOptions={{
        headerShown: false,
        animation: "fade",
      }}
    >
      <Stack.Screen name="home/index" />
      <Stack.Screen name="marketplace/index" />
      <Stack.Screen name="search/index" />
      <Stack.Screen name="cart/index" />
      <Stack.Screen name="wishlist/index" />
      <Stack.Screen name="orders/index" />
      <Stack.Screen name="notifications/index" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
