import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import {
  CormorantGaramond_300Light,
  CormorantGaramond_400Regular,
} from "@expo-google-fonts/cormorant-garamond";
import { Inter_400Regular, Inter_500Medium } from "@expo-google-fonts/inter";
import { AuthProvider } from "../src/providers/AuthProvider";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { ToastProvider } from "../src/providers/ToastProvider";
import { NotificationProvider } from "../src/providers/NotificationProvider";
import { CartProvider } from "../src/providers/CartProvider";
import { AddressProvider } from "../src/providers/AddressProvider";
import { WishlistProvider } from "../src/providers/WishlistProvider";
import { OfflineBanner } from "../src/components/OfflineBanner";
import { SessionExpiredModal } from "../src/components/SessionExpiredModal";
import { useNetworkStatus } from "../src/hooks/useNetworkStatus";

function AppShell() {
  const { isConnected } = useNetworkStatus();

  return (
    <>
      <OfflineBanner visible={!isConnected} />
      <SessionExpiredModal />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#FAF7F2" },
          animation: "fade",
          gestureEnabled: true,
        }}
      >
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
    CormorantGaramond_300Light,
    CormorantGaramond_400Regular,
    Inter_400Regular,
    Inter_500Medium,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}
