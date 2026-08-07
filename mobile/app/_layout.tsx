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
import {
  queryClient,
  queryPersister,
  shouldPersistQuery,
} from "../src/providers/queryClient";
import { colors, radius } from "../src/theme/tokens";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { GlobalBottomBar } from "../src/components/GlobalBottomBar";
import { useImageMemoryRelease } from "../src/lib/memory-pressure";
// import InAppUpdates, { IAUUpdateKind } from "react-native-in-app-updates";

function AppShell() {
  const { isConnected } = useNetworkStatus();
  // Hand decoded bitmaps back to the OS whenever the app leaves the screen.
  useImageMemoryRelease();
  const [updateAvailable, setUpdateAvailable] = React.useState(false);
  // const inAppUpdatesRef = React.useRef<InAppUpdates | null>(null);

  React.useEffect(() => {
    // In-app updates feature disabled (package unavailable)
    // Original code checked for app updates on Android and triggered flexible updates
    // This can be re-enabled by installing the correct in-app-updates package
    return () => {
      // no cleanup needed
    };
  }, []);

  // Update feature disabled — in-app-updates package unavailable
  // const handleUpdatePress = React.useCallback(async () => {
  //   const updater = inAppUpdatesRef.current;
  //   if (!updater) return;
  //   try {
  //     await updater.startUpdate({ updateType: IAUUpdateKind.FLEXIBLE });
  //   } catch {
  //     // ignore
  //   }
  // }, []);

  return (
    <>
      <OfflineBanner visible={!isConnected} />
      {updateAvailable ? (
        <View style={styles.updateBanner}>
          <View style={styles.updateTextWrap}>
            <Text style={styles.updateTitle}>Update available</Text>
            <Text style={styles.updateSubtitle}>Please update the app from Play Store.</Text>
          </View>
          <Pressable style={styles.updateButton} onPress={() => {}}>
            <Text style={styles.updateButtonText}>Update</Text>
          </Pressable>
        </View>
      ) : null}
      {/*
        One grammar for the whole app, so a transition tells the shopper where
        they went without them having to think about it:

          · Lateral slide  — going deeper into the catalogue. The new screen
                             comes from the side it will return to.
          · Rise from below — a task you can abandon: checkout, sign-in,
                             tracking. Modal motion, modal meaning.
          · Cross-fade      — peers. The tab navigator handles those itself.

        The old default was a fade-up on everything, which spends its opening
        frames showing mostly background and reads as slower than it is.
      */}
      <Stack
        initialRouteName="(tabs)"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
          animationDuration: 260,
          gestureEnabled: true,
          // The single most important line in this file for sustained
          // performance.
          //
          // A native stack keeps every pushed screen mounted so the back gesture
          // can reveal it instantly. Without freezing, those mounted screens
          // also keep *re-rendering*: this app's product screen subscribes to
          // five contexts (auth, cart, wishlist, network, toast), so a single
          // add-to-cart re-rendered every product page still on the stack.
          //
          // "You may also like" lets a shopper chain product → product → product
          // without limit. Ten deep meant ten full product screens — ten
          // galleries, ten review lists, eighty related-product cards — all
          // re-rendering on every cart or wishlist change. That is why the app
          // was fine on launch and degraded the longer it was used, on fast
          // phones as well as slow ones.
          //
          // freezeOnBlur suspends rendering for anything not on screen. State is
          // kept, so going back is still instant; the work simply stops.
          freezeOnBlur: true,
        }}
      >
        {/* The root. Returning to it should feel like arriving home, not like
            another push, so it fades rather than sliding. */}
        <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />

        {/* Sign-in and registration are tasks, not destinations. */}
        <Stack.Screen
          name="(auth)"
          options={{ animation: "slide_from_bottom", animationDuration: 300 }}
        />

        {/* The most-tapped transition in the app, and slightly quicker than the
            rest: the product page is already painted from the card's own data,
            so a longer animation would just be holding finished content back. */}
        <Stack.Screen
          name="product/[id]/index"
          options={{ animation: "slide_from_right", animationDuration: 220 }}
        />

        {/* Checkout is a committed flow — it rises, and dismissing it reads as
            backing out rather than going back a level. */}
        <Stack.Screen
          name="checkout/index"
          options={{ animation: "slide_from_bottom", animationDuration: 300 }}
        />

        <Stack.Screen name="orders/[id]/index" />
        <Stack.Screen
          name="orders/[id]/tracking"
          options={{ animation: "slide_from_bottom" }}
        />

        <Stack.Screen name="support/index" />
        <Stack.Screen name="support/[id]" />
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
          persistOptions={{
            persister: queryPersister,
            dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
          }}
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
    borderRadius: radius.md,
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
