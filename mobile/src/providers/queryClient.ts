import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient, type Query } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 1,
      refetchOnMount: false,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
      networkMode: "offlineFirst",
    },
    mutations: {
      retry: 0,
    },
  },
});

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "TATVIVAH_RQ_CACHE_V1",
  // Every persist re-serialises the whole cache on the JS thread. Once a second
  // meant that cost landed squarely inside navigation, where three or four
  // queries settle in quick succession.
  throttleTime: 4000,
});

/**
 * Queries worth surviving a cold start.
 *
 * The persister has no per-query granularity: it dehydrates and `JSON.stringify`s
 * the *entire* cache on every write. With a 24-hour gcTime and nothing filtered,
 * that blob grew with every product a shopper opened, and the serialisation cost
 * was paid on the JS thread at exactly the wrong moment — mid-navigation.
 *
 * Only the handful of queries that make the app open with content rather than a
 * spinner are kept. Everything else is still cached in memory for the session;
 * it just is not written to disk.
 */
const PERSISTED_QUERY_PREFIXES = new Set([
  "products",
  "categories",
  "home-categories",
  "home-occasions",
  "home-bestsellers",
]);

export function shouldPersistQuery(query: Query): boolean {
  // Overriding this replaces react-query's default predicate outright, so the
  // success check has to be repeated here — writing a pending or failed query to
  // disk would restore the app into that broken state on next launch.
  if (query.state.status !== "success") return false;

  const root = query.queryKey?.[0];
  return typeof root === "string" && PERSISTED_QUERY_PREFIXES.has(root);
}
