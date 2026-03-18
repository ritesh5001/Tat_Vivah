import * as React from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { AuthProvider } from "../src/providers/AuthProvider";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { ToastProvider } from "../src/providers/ToastProvider";
import { NotificationProvider } from "../src/providers/NotificationProvider";
import { CartProvider } from "../src/providers/CartProvider";
import { AddressProvider } from "../src/providers/AddressProvider";
import { WishlistProvider } from "../src/providers/WishlistProvider";
import { OfflineBanner } from "../src/components/OfflineBanner";
import { useNetworkStatus } from "../src/hooks/useNetworkStatus";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { queryClient, queryPersister } from "../src/providers/queryClient";
import { colors } from "../src/theme/tokens";
import { GestureHandlerRootView } from "react-native-gesture-handler";

function AppShell() {
  const { isConnected } = useNetworkStatus();

  return (
    <>
      <OfflineBanner visible={!isConnected} />
      <Stack
        initialRouteName="(tabs)"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "fade",
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        {/* Order detail — slides in from right */}
        <Stack.Screen
          name="orders/[id]/index"
          options={{ animation: "slide_from_right" }}
        />
        {/* Tracking — slides up from bottom */}
        <Stack.Screen
          name="orders/[id]/tracking"
          options={{ animation: "slide_from_bottom" }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_300Light: require("../assets/fonts/CormorantGaramond_300Light.ttf"),
    CormorantGaramond_400Regular: require("../assets/fonts/CormorantGaramond_400Regular.ttf"),
    Inter_400Regular: require("../assets/fonts/Inter_400Regular.ttf"),
    Inter_500Medium: require("../assets/fonts/Inter_500Medium.ttf"),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: queryPersister }}
        >
          <ToastProvider>
            <AuthProvider>
              <NotificationProvider>
                <CartProvider>
                  <WishlistProvider>
                    <AddressProvider>
                      <AppShell />
                    </AddressProvider>
                  </WishlistProvider>
                </CartProvider>
              </NotificationProvider>
            </AuthProvider>
          </ToastProvider>
        </PersistQueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
