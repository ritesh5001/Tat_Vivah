import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  AppState,
  type AppStateStatus,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors, radius, spacing, typography, shadow } from "../../../src/theme/tokens";
import {
  getOrderTracking,
  isTerminalStatus,
  type TrackingResponse,
  type ShipmentStatus,
} from "../../../src/services/shipping";
import { ApiError } from "../../../src/services/api";
import { ShippingTimeline } from "../../../src/components/ShippingTimeline";
import { useToast } from "../../../src/providers/ToastProvider";
import { useAuth } from "../../../src/hooks/useAuth";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const POLL_INTERVAL_MS = 30_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function relativeTime(iso: string | undefined | null): string {
  if (!iso) return "";
  try {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 0) return "";
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function TrackingScreen() {
  const { id: orderId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const token = session?.accessToken ?? null;
  const { showToast } = useToast();

  const [tracking, setTracking] = React.useState<TrackingResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = React.useState<string | null>(null);

  // Track whether screen is mounted to prevent set-state after unmount
  const mountedRef = React.useRef(true);
  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ---- Fetch logic ----
  const fetchTracking = React.useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!orderId || !token) return;
      if (!opts?.silent) setLoading(true);
      setError(null);

      try {
        const data = await getOrderTracking(orderId, token);
        if (mountedRef.current) {
          setTracking(data);
          setLastFetchedAt(new Date().toISOString());
        }
      } catch (err) {
        if (!mountedRef.current) return;
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to load tracking info.";
        setError(message);
        if (opts?.silent) showToast(message, "error");
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [orderId, token, showToast]
  );

  // Initial fetch
  React.useEffect(() => {
    fetchTracking();
  }, [fetchTracking]);

  // ---- AppState-aware polling ----
  // Stops permanently when DELIVERED. Pauses in background. Resumes on active.
  React.useEffect(() => {
    const leadStatus: ShipmentStatus | undefined =
      tracking?.shipments?.[0]?.status;
    // Terminal → no polling ever
    if (leadStatus && isTerminalStatus(leadStatus)) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (intervalId) return; // prevent duplicate intervals
      intervalId = setInterval(() => {
        fetchTracking({ silent: true });
      }, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    // Start immediately if app is active
    if (AppState.currentState === "active") {
      startPolling();
    }

    const handleAppState = (next: AppStateStatus) => {
      if (next === "active") {
        // Fetch immediately on resume, then restart interval
        fetchTracking({ silent: true });
        startPolling();
      } else {
        stopPolling();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppState);

    return () => {
      stopPolling();
      subscription.remove();
    };
  }, [tracking, fetchTracking]);

  // ---- Pull to refresh ----
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchTracking({ silent: true });
  }, [fetchTracking]);

  // ---- Derived values ----
  const shipment = tracking?.shipments?.[0] ?? null;
  const shipmentStatus: ShipmentStatus = shipment?.status ?? "CREATED";
  const isDelivered = shipmentStatus === "DELIVERED";
  const timestamps: Partial<Record<ShipmentStatus, string | null>> = {
    CREATED: tracking?.shipments?.length
      ? shipment?.events?.find((e) => e.status === "CREATED")?.createdAt ?? null
      : null,
    SHIPPED: shipment?.shippedAt ?? null,
    DELIVERED: shipment?.deliveredAt ?? null,
  };
  const lastUpdatedLabel = relativeTime(lastFetchedAt);

  // ---- Render ----
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Order Tracking</Text>
        <View style={{ width: 48 }} />
      </View>

      {/* Loading state */}
      {loading && !tracking ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.gold} size="large" />
          <Text style={styles.loadingText}>Loading tracking…</Text>
        </View>
      ) : error && !tracking ? (
        /* Error state with retry */
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Unable to load tracking</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => fetchTracking()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.gold}
            />
          }
        >
          {/* Delivered success banner */}
          {isDelivered ? (
            <View style={styles.deliveredBanner}>
              <Text style={styles.deliveredText}>
                Your order has been delivered
              </Text>
            </View>
          ) : null}

          {/* Order summary card */}
          <View style={styles.card}>
            <Text style={styles.orderId}>
              Order {orderId?.slice(0, 8).toUpperCase()}
            </Text>
            <Text style={styles.orderStatus}>
              {tracking?.status ?? "—"}
            </Text>
          </View>

          {/* Timeline */}
          {shipment ? (
            <View style={styles.card}>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Shipment progress</Text>
                {lastUpdatedLabel ? (
                  <Text style={styles.lastUpdated}>
                    Updated {lastUpdatedLabel}
                  </Text>
                ) : null}
              </View>
              <ShippingTimeline
                status={shipmentStatus}
                timestamps={timestamps}
              />

              {/* Carrier info */}
              {shipment.carrier ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Carrier</Text>
                  <Text style={styles.metaValue}>{shipment.carrier}</Text>
                </View>
              ) : null}
              {shipment.trackingNumber ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Tracking #</Text>
                  <Text style={styles.metaValue}>
                    {shipment.trackingNumber}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.noShipment}>
                No shipment information available yet.
              </Text>
            </View>
          )}

          {/* Event log */}
          {shipment && shipment.events.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Activity</Text>
              {shipment.events
                .slice()
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                )
                .map((event) => (
                  <View key={event.id} style={styles.eventRow}>
                    <Text style={styles.eventStatus}>{event.status}</Text>
                    <Text style={styles.eventNote}>
                      {event.note ?? "—"}
                    </Text>
                    <Text style={styles.eventDate}>
                      {new Date(event.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                ))}
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  backText: {
    fontFamily: typography.sans,
    fontSize: 13,
    color: colors.gold,
  },
  headerTitle: {
    fontFamily: typography.serif,
    fontSize: 18,
    color: colors.charcoal,
  },

  // Centered states
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
  },
  errorTitle: {
    fontFamily: typography.serif,
    fontSize: 18,
    color: colors.charcoal,
    marginBottom: spacing.xs,
  },
  errorMessage: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
    textAlign: "center",
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  retryButton: {
    backgroundColor: colors.charcoal,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  retryText: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.background,
  },

  // Scroll content
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.warmWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...shadow.card,
  },
  orderId: {
    fontFamily: typography.serif,
    fontSize: 16,
    color: colors.charcoal,
  },
  orderStatus: {
    marginTop: spacing.xs,
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.gold,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  sectionTitle: {
    fontFamily: typography.sansMedium,
    fontSize: 11,
    color: colors.brownSoft,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: spacing.md,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastUpdated: {
    fontFamily: typography.sans,
    fontSize: 10,
    color: colors.brownSoft,
    marginBottom: spacing.md,
  },
  deliveredBanner: {
    backgroundColor: "#FAF5EE",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#B7956C",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  deliveredText: {
    fontFamily: typography.serif,
    fontSize: 15,
    color: "#B7956C",
    textAlign: "center",
  },
  noShipment: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.brownSoft,
    textAlign: "center",
    paddingVertical: spacing.md,
  },

  // Carrier meta
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSoft,
    marginTop: spacing.sm,
  },
  metaLabel: {
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.brownSoft,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  metaValue: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    color: colors.charcoal,
  },

  // Event log
  eventRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSoft,
  },
  eventStatus: {
    fontFamily: typography.sansMedium,
    fontSize: 11,
    color: colors.gold,
    textTransform: "uppercase",
    letterSpacing: 1.0,
  },
  eventNote: {
    marginTop: 2,
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.charcoal,
  },
  eventDate: {
    marginTop: 2,
    fontFamily: typography.sans,
    fontSize: 11,
    color: colors.brownSoft,
  },
});
