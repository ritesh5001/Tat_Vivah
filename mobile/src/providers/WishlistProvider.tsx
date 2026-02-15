import * as React from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "./ToastProvider";
import { isAbortError } from "../services/api";
import {
  getWishlist,
  toggleWishlistItem as apiToggle,
  removeWishlistItem as apiRemove,
  type WishlistItemDetail,
} from "../services/wishlist";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface WishlistContextValue {
  /** Current wishlist items. */
  wishlistItems: WishlistItemDetail[];
  /** Set of product IDs in the wishlist (for quick lookup). */
  wishlistedIds: ReadonlySet<string>;
  /** Number of items. */
  wishlistCount: number;
  /** True while initial fetch is in progress. */
  isLoading: boolean;
  /** True while any mutation is in-flight. */
  isMutating: boolean;
  /** Set of product IDs currently being mutated. */
  mutatingIds: ReadonlySet<string>;
  /** Full refresh from server. */
  refreshWishlist: () => Promise<void>;
  /** Toggle product in/out of wishlist — optimistic. */
  toggleWishlist: (productId: string) => Promise<void>;
  /** Remove product from wishlist — optimistic. */
  removeFromWishlist: (productId: string) => Promise<void>;
  /** Check if a specific product is wishlisted. */
  isWishlisted: (productId: string) => boolean;
  /** Non-null error when last fetch failed. */
  fetchError: string | null;
}

const WishlistContext = React.createContext<WishlistContextValue>({
  wishlistItems: [],
  wishlistedIds: new Set(),
  wishlistCount: 0,
  isLoading: true,
  isMutating: false,
  mutatingIds: new Set(),
  refreshWishlist: async () => {},
  toggleWishlist: async () => {},
  removeFromWishlist: async () => {},
  isWishlisted: () => false,
  fetchError: null,
});

export function useWishlist() {
  return React.useContext(WishlistContext);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const token = session?.accessToken ?? null;
  const { showToast } = useToast();

  const [wishlistItems, setWishlistItems] = React.useState<WishlistItemDetail[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  // Per-item mutation lock
  const [mutatingIds, setMutatingIds] = React.useState<Set<string>>(new Set());
  const mutationLockRef = React.useRef<Set<string>>(new Set());

  const mountedRef = React.useRef(true);
  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Derived
  const isMutating = mutatingIds.size > 0;
  const wishlistCount = wishlistItems.length;

  const wishlistedIds = React.useMemo(
    () => new Set(wishlistItems.map((i) => i.productId)),
    [wishlistItems]
  );

  const isWishlisted = React.useCallback(
    (productId: string) => wishlistedIds.has(productId),
    [wishlistedIds]
  );

  // ---- Lock / unlock helpers ----
  const lockItem = React.useCallback((id: string): boolean => {
    if (mutationLockRef.current.has(id)) return false;
    mutationLockRef.current.add(id);
    setMutatingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    return true;
  }, []);

  const unlockItem = React.useCallback((id: string) => {
    mutationLockRef.current.delete(id);
    setMutatingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // ---- Fetch wishlist from server ----
  const refreshWishlist = React.useCallback(async () => {
    if (!token) return;
    try {
      setFetchError(null);
      const result = await getWishlist(token);
      if (mountedRef.current) {
        setWishlistItems(result.wishlist.items ?? []);
      }
    } catch (err) {
      if (isAbortError(err)) return;
      if (mountedRef.current) {
        setFetchError(
          err instanceof Error ? err.message : "Failed to load wishlist"
        );
      }
    }
  }, [token]);

  // ---- Initial + auth-change load ----
  React.useEffect(() => {
    if (!token) {
      mutationLockRef.current.clear();
      setWishlistItems([]);
      setIsLoading(false);
      setFetchError(null);
      setMutatingIds(new Set());
      return;
    }

    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        const result = await getWishlist(token);
        if (!cancelled && mountedRef.current) {
          setWishlistItems(result.wishlist.items ?? []);
        }
      } catch (err) {
        if (isAbortError(err) || cancelled) return;
        if (mountedRef.current) {
          setFetchError(
            err instanceof Error ? err.message : "Failed to load wishlist"
          );
        }
      } finally {
        if (!cancelled && mountedRef.current) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  // ---- Auto-refresh when app comes to foreground ----
  React.useEffect(() => {
    if (!token) return;

    const handleAppState = (state: AppStateStatus) => {
      if (state === "active") {
        refreshWishlist();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppState);
    return () => subscription.remove();
  }, [token, refreshWishlist]);

  // ---- Toggle wishlist item (optimistic) ----
  const toggleWishlist = React.useCallback(
    async (productId: string) => {
      if (!token) return;
      if (!lockItem(productId)) return;

      const snapshot = [...wishlistItems];
      const currentlyWishlisted = wishlistedIds.has(productId);

      // Optimistic
      if (currentlyWishlisted) {
        setWishlistItems((prev) => prev.filter((i) => i.productId !== productId));
      } else {
        // Add a placeholder
        setWishlistItems((prev) => [
          {
            id: `optimistic_${productId}`,
            productId,
            createdAt: new Date().toISOString(),
            product: {
              id: productId,
              title: "",
              description: null,
              images: [],
              sellerPrice: null,
              adminListingPrice: null,
              isPublished: true,
              category: null,
            },
          },
          ...prev,
        ]);
      }

      try {
        await apiToggle(productId, token);
        // Full refresh for server truth
        await refreshWishlist();
      } catch (err) {
        if (!isAbortError(err)) {
          if (mountedRef.current) setWishlistItems(snapshot);
          const msg =
            err instanceof Error ? err.message : "Failed to update wishlist";
          showToast(msg, "error");
        }
      } finally {
        if (mountedRef.current) unlockItem(productId);
      }
    },
    [token, wishlistItems, wishlistedIds, lockItem, unlockItem, refreshWishlist, showToast]
  );

  // ---- Remove from wishlist (optimistic) ----
  const removeFromWishlist = React.useCallback(
    async (productId: string) => {
      if (!token) return;
      if (!lockItem(productId)) return;

      const snapshot = [...wishlistItems];
      setWishlistItems((prev) => prev.filter((i) => i.productId !== productId));

      try {
        await apiRemove(productId, token);
        await refreshWishlist();
      } catch (err) {
        if (!isAbortError(err)) {
          if (mountedRef.current) setWishlistItems(snapshot);
          const msg =
            err instanceof Error ? err.message : "Failed to remove from wishlist";
          showToast(msg, "error");
        }
      } finally {
        if (mountedRef.current) unlockItem(productId);
      }
    },
    [token, wishlistItems, lockItem, unlockItem, refreshWishlist, showToast]
  );

  // ---- Context value ----
  const value = React.useMemo<WishlistContextValue>(
    () => ({
      wishlistItems,
      wishlistedIds,
      wishlistCount,
      isLoading,
      isMutating,
      mutatingIds,
      refreshWishlist,
      toggleWishlist,
      removeFromWishlist,
      isWishlisted,
      fetchError,
    }),
    [
      wishlistItems,
      wishlistedIds,
      wishlistCount,
      isLoading,
      isMutating,
      mutatingIds,
      refreshWishlist,
      toggleWishlist,
      removeFromWishlist,
      isWishlisted,
      fetchError,
    ]
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}
