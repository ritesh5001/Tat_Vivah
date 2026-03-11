import React from "react";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { queryClient, queryPersister } from "./queryClient";

type Props = {
  children: React.ReactNode;
};

export function AppProviders({ children }: Props) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: queryPersister }}
        >
          {children}
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
