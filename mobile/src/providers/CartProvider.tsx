import * as React from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "./ToastProvider";
import { isAbortError } from "../services/api";
import {
  getCart,
  addCartItem as apiAddCartItem,
  updateCartItem as apiUpdateCartItem,
  removeCartItem as apiRemoveCartItem,
  type CartItemDetails,
  type AddCartItemPayload,
} from "../services/cart";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface CartContextValue {
  /** Current cart items. */
  cartItems: CartItemDetails[];
  /** Derived count (sum of quantities). */
  cartCount: number;
  /** True while the initial cart is loading from the server. */
  isLoading: boolean;
  /** True while any mutation (add / update / remove) is in-flight. */
  isMutating: boolean;
  /** Set of item IDs currently being mutated (per-item lock). */
  mutatingIds: ReadonlySet<string>;
  /** Full server refresh. */
  refreshCart: () => Promise<void>;
  /** Add a new item — optimistic insert, rolls back on API failure. */
  addToCart: (payload: AddCartItemPayload) => Promise<void>;
  /** Update quantity — optimistic, rolls back on failure.  qty <= 0 removes. */
  updateQuantity: (itemId: string, nextQty: number) => Promise<void>;
  /** Remove item — optimistic, rolls back on failure. */
  removeFromCart: (itemId: string) => Promise<void>;
  /** Clear local cart state (used after successful checkout). */
  clearCart: () => void;
  /** Non-null error string when the last fetch failed (for retry UI). */
  fetchError: string | null;
}

const CartContext = React.createContext<CartContextValue>({
  cartItems: [],
  cartCount: 0,
  isLoading: true,
  isMutating: false,
  mutatingIds: new Set(),
  refreshCart: async () => {},
  addToCart: async () => {},
  updateQuantity: async () => {},
  removeFromCart: async () => {},
  clearCart: () => {},
  fetchError: null,
});

export function useCart() {
  return React.useContext(CartContext);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const token = session?.accessToken ?? null;
  const { showToast } = useToast();

  const [cartItems, setCartItems] = React.useState<CartItemDetails[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  // Per-item mutation lock to prevent rapid double-taps
  const [mutatingIds, setMutatingIds] = React.useState<Set<string>>(
    new Set()
  );

  const mountedRef = React.useRef(true);
  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Derived
  const isMutating = mutatingIds.size > 0;
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  // ---- Lock / unlock helpers ----
  const lockItem = React.useCallback((id: string) => {
    setMutatingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const unlockItem = React.useCallback((id: string) => {
    setMutatingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // ---- Fetch cart from server ----
  const refreshCart = React.useCallback(async () => {
    if (!token) return;
    try {
      setFetchError(null);
      const result = await getCart(token);
      if (mountedRef.current) {
        setCartItems(result.cart.items ?? []);
      }
    } catch (err) {
      if (isAbortError(err)) return;
      if (mountedRef.current) {
        setFetchError(
          err instanceof Error ? err.message : "Failed to load cart"
        );
      }
    }
  }, [token]);

  // ---- Initial + auth-change load ----
  React.useEffect(() => {
    if (!token) {
      // Logged out → clear
      setCartItems([]);
      setIsLoading(false);
      setFetchError(null);
      setMutatingIds(new Set());
      return;
    }

    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        const result = await getCart(token);
        if (!cancelled && mountedRef.current) {
          setCartItems(result.cart.items ?? []);
        }
      } catch (err) {
        if (isAbortError(err) || cancelled) return;
        if (mountedRef.current) {
          setFetchError(
            err instanceof Error ? err.message : "Failed to load cart"
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
        refreshCart();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppState);
    return () => subscription.remove();
  }, [token, refreshCart]);

  // ---- Add to cart ----
  const addToCart = React.useCallback(
    async (payload: AddCartItemPayload) => {
      if (!token) return;

      // Use a temp key for the lock (productId+variantId)
      const tempKey = `add_${payload.productId}_${payload.variantId}`;
      if (mutatingIds.has(tempKey)) return; // prevent double-tap

      lockItem(tempKey);
      try {
        await apiAddCartItem(payload, token);
        // Full refresh to get consistent server state (priceSnapshot, id, etc.)
        await refreshCart();
      } catch (err) {
        if (!isAbortError(err)) {
          const msg =
            err instanceof Error ? err.message : "Failed to add item";
          showToast(msg, "error");
        }
        throw err; // re-throw so caller knows it failed
      } finally {
        if (mountedRef.current) unlockItem(tempKey);
      }
    },
    [token, mutatingIds, lockItem, unlockItem, refreshCart, showToast]
  );

  // ---- Update quantity (optimistic) ----
  const updateQuantity = React.useCallback(
    async (itemId: string, nextQty: number) => {
      if (!token) return;
      if (mutatingIds.has(itemId)) return; // debounce rapid taps

      if (nextQty <= 0) {
        return removeFromCart(itemId);
      }

      // Snapshot for rollback
      const snapshot = [...cartItems];

      // Optimistic update
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, quantity: nextQty } : item
        )
      );

      lockItem(itemId);
      try {
        await apiUpdateCartItem(itemId, nextQty, token);
        // Sync with server truth
        await refreshCart();
      } catch (err) {
        if (!isAbortError(err)) {
          // Rollback
          if (mountedRef.current) setCartItems(snapshot);
          const msg =
            err instanceof Error ? err.message : "Failed to update quantity";
          showToast(msg, "error");
        }
      } finally {
        if (mountedRef.current) unlockItem(itemId);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, cartItems, mutatingIds, lockItem, unlockItem, refreshCart, showToast]
  );

  // ---- Remove item (optimistic) ----
  const removeFromCart = React.useCallback(
    async (itemId: string) => {
      if (!token) return;
      if (mutatingIds.has(itemId)) return;

      const snapshot = [...cartItems];

      // Optimistic removal
      setCartItems((prev) => prev.filter((item) => item.id !== itemId));

      lockItem(itemId);
      try {
        await apiRemoveCartItem(itemId, token);
        // Server is source of truth — but we already removed locally, just refresh
        await refreshCart();
      } catch (err) {
        if (!isAbortError(err)) {
          if (mountedRef.current) setCartItems(snapshot);
          const msg =
            err instanceof Error ? err.message : "Failed to remove item";
          showToast(msg, "error");
        }
      } finally {
        if (mountedRef.current) unlockItem(itemId);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, cartItems, mutatingIds, lockItem, unlockItem, refreshCart, showToast]
  );

  // ---- Clear local cart (post-checkout) ----
  const clearCart = React.useCallback(() => {
    setCartItems([]);
    setFetchError(null);
    setMutatingIds(new Set());
  }, []);

  // ---- Context value ----
  const value = React.useMemo<CartContextValue>(
    () => ({
      cartItems,
      cartCount,
      isLoading,
      isMutating,
      mutatingIds,
      refreshCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      fetchError,
    }),
    [
      cartItems,
      cartCount,
      isLoading,
      isMutating,
      mutatingIds,
      refreshCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      fetchError,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
