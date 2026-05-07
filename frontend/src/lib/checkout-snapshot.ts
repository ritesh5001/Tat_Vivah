export const CHECKOUT_CART_SNAPSHOT_KEY = "tatvivah_checkout_cart_snapshot";
export const CHECKOUT_CART_SNAPSHOT_TTL_MS = 60_000;
export const CHECKOUT_ADDRESSES_CACHE_KEY = "tatvivah_checkout_addresses_cache";
export const CHECKOUT_ADDRESS_CACHE_TTL_MS = 5 * 60_000;

export type CheckoutSnapshotItem = {
  variantId: string;
  quantity: number;
  priceSnapshot: number;
};

export function persistCheckoutCartSnapshot(items: CheckoutSnapshotItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    CHECKOUT_CART_SNAPSHOT_KEY,
    JSON.stringify({
      at: Date.now(),
      items,
    })
  );
}

export function readCheckoutCartSnapshot() {
  if (typeof window === "undefined") {
    return null;
  }

  const cached = window.sessionStorage.getItem(CHECKOUT_CART_SNAPSHOT_KEY);
  if (!cached) {
    return null;
  }

  try {
    const parsed = JSON.parse(cached) as {
      at: number;
      items: CheckoutSnapshotItem[];
    };

    if (
      Date.now() - parsed.at < CHECKOUT_CART_SNAPSHOT_TTL_MS &&
      Array.isArray(parsed.items)
    ) {
      return parsed.items;
    }
  } catch {
    // Ignore malformed cache.
  }

  return null;
}

export function upsertCheckoutSnapshotItem(item: CheckoutSnapshotItem) {
  const existing = readCheckoutCartSnapshot() ?? [];
  const next = existing.filter((entry) => entry.variantId !== item.variantId);
  next.push(item);
  persistCheckoutCartSnapshot(next);
}
