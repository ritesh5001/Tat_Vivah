import * as React from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { AppText as Text } from "../src/components";
import Constants from "expo-constants";
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
import { GlobalBottomBar } from "../src/components/GlobalBottomBar";
import InAppUpdates, { IAUUpdateKind } from "react-native-in-app-updates";

function AppShell() {
  const { isConnected } = useNetworkStatus();
  const [updateAvailable, setUpdateAvailable] = React.useState(false);
  const inAppUpdatesRef = React.useRef<InAppUpdates | null>(null);

  React.useEffect(() => {
    let active = true;

    const load = async () => {
      if (Platform.OS !== "android") return;
      if (Constants.appOwnership === "expo") return;

      try {
        const inAppUpdates = new InAppUpdates(false);
        inAppUpdatesRef.current = inAppUpdates;
        const result = await inAppUpdates.checkNeedsUpdate();
        if (!active) return;
        setUpdateAvailable(Boolean(result?.shouldUpdate));
      } catch {
        // Silent fail: app should continue even if version check fails.
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const handleUpdatePress = React.useCallback(async () => {
    const updater = inAppUpdatesRef.current;
    if (!updater) return;

    try {
      await updater.startUpdate({ updateType: IAUUpdateKind.FLEXIBLE });
    } catch {
      // ignore
    }
  }, []);

  return (
    <>
      <OfflineBanner visible={!isConnected} />
      {updateAvailable ? (
        <View style={styles.updateBanner}>
          <View style={styles.updateTextWrap}>
            <Text style={styles.updateTitle}>Update available</Text>
            <Text style={styles.updateSubtitle}>Please update the app from Play Store.</Text>
          </View>
          <Pressable style={styles.updateButton} onPress={handleUpdatePress}>
            <Text style={styles.updateButtonText}>Update</Text>
          </Pressable>
        </View>
      ) : null}
      <Stack
        initialRouteName="(tabs)"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "fade_from_bottom",
          animationDuration: 260,
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
      <GlobalBottomBar />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts(
    Platform.OS === "web"
      ? {}
      : {
          CormorantGaramond_300Light: require("../assets/fonts/CormorantGaramond_300Light.ttf"),
          CormorantGaramond_400Regular: require("../assets/fonts/CormorantGaramond_400Regular.ttf"),
          Inter_400Regular: require("../assets/fonts/Inter_400Regular.ttf"),
          Inter_500Medium: require("../assets/fonts/Inter_500Medium.ttf"),
        },
  );

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

const styles = StyleSheet.create({
  updateBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: "rgba(184, 149, 108, 0.12)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  updateTextWrap: {
    flex: 1,
  },
  updateTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: colors.charcoal,
  },
  updateSubtitle: {
    marginTop: 4,
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: colors.brownSoft,
  },
  updateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: colors.gold,
  },
  updateButtonText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.background,
  },
});
