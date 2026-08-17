import * as React from "react";
import { Stack, usePathname } from "expo-router";
import { useFonts } from "expo-font";
import { StatusBar } from "react-native";
import * as SplashScreen from "expo-splash-screen";
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
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import {
  queryClient,
  queryPersister,
  shouldPersistQuery,
} from "../src/providers/queryClient";
import { colors } from "../src/theme/tokens";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import { GlobalBottomBar } from "../src/components/GlobalBottomBar";
import { useImageMemoryRelease } from "../src/lib/memory-pressure";
import { useRouteRestore } from "../src/lib/route-restore";
// import InAppUpdates, { IAUUpdateKind } from "react-native-in-app-updates";

// Keep the native launch artwork visible until the brand fonts are ready. A
// blank React tree produces a white flash on slower devices.
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function AppShell() {
  const { isConnected } = useNetworkStatus();
  // Hand decoded bitmaps back to the OS whenever the app leaves the screen.
  useImageMemoryRelease();
  // Come back to the screen the shopper left, if Android killed us meanwhile.
  useRouteRestore();

  return (
    <>
      <OfflineBanner visible={!isConnected} />
      {/*
        One grammar for the whole app, so a transition tells the shopper where
        they went without them having to think about it:

          · Lateral slide  — going deeper into the catalogue. The new screen
                             comes from the side it will return to.
          · Rise from below — a task you can abandon: checkout, sign-in,
                             tracking. Modal motion, modal meaning.
          · Cross-fade      — peers. The tab navigator handles those itself.

        Every value below is a `stackAnimation` from react-native-screens: a
        native-stack transition that runs on the platform's own navigation
        controller (UINavigationController / Fragment transitions on Fabric),
        not a Reanimated value recalculated on the JS thread. It cannot
        compete with a product grid, video feed, or checkout tree mounting
        underneath it — the two run on different threads. That decoupling,
        not the absence of motion, is what keeps this smooth on mid-range
        Android; see freezeOnBlur below for the other half of that story.
      */}
      <Stack
        initialRouteName="(tabs)"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "simple_push",
          animationDuration: 240,
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
          options={{ animation: "slide_from_bottom", animationDuration: 280 }}
        />

        {/* The most-tapped transition in the app. simple_push is the same
            lateral slide as the default but skips the outgoing screen's
            parallax/shadow interpolation — one less native layer animating
            per frame on a screen that is already the heaviest mount in the
            stack. */}
        <Stack.Screen
          name="product/[id]/index"
          options={{ animation: "simple_push", animationDuration: 220 }}
        />

        {/* Checkout is a committed flow — it rises, and dismissing it reads as
            backing out rather than going back a level. */}
        <Stack.Screen
          name="checkout/index"
          options={{ animation: "slide_from_bottom", animationDuration: 280 }}
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

/**
 * Keep the route subscription isolated from the provider tree. When
 * `usePathname` lived in RootLayout, every navigation re-rendered every global
 * provider and the complete navigator while the transition was in progress.
 */
const AppStatusBar = React.memo(function AppStatusBar() {
  const pathname = usePathname();
  const immersive = pathname === "/reels" || pathname.startsWith("/reels/");

  return (
    <StatusBar
      barStyle={immersive ? "light-content" : "dark-content"}
      backgroundColor={immersive ? colors.media : colors.background}
      translucent={false}
    />
  );
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    CormorantGaramond_300Light: require("../assets/fonts/CormorantGaramond_300Light.ttf"),
    CormorantGaramond_400Regular: require("../assets/fonts/CormorantGaramond_400Regular.ttf"),
    Inter_400Regular: require("../assets/fonts/Inter_400Regular.ttf"),
    Inter_500Medium: require("../assets/fonts/Inter_500Medium.ttf"),
  });

  React.useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics} style={{ flex: 1 }}>
      <AppStatusBar />
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
                <SessionExpiredModal />
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
    </SafeAreaProvider>
  );
}
