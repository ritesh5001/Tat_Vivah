"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  getShippingSetting,
  updateShippingSetting,
  type ShippingSetting,
} from "@/services/admin";
import { toast } from "sonner";
import { Truck } from "lucide-react";

export default function AdminSettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [shipping, setShipping] = React.useState<ShippingSetting | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await getShippingSetting();
      setShipping(result);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load settings"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleToggle = async (next: boolean) => {
    if (saving || !shipping) return;
    setSaving(true);
    // Optimistic update
    setShipping((prev) => (prev ? { ...prev, enabled: next } : prev));
    try {
      const result = await updateShippingSetting(next);
      setShipping(result);
      toast.success(
        next ? "Shipping charge enabled" : "Shipping charge disabled"
      );
    } catch (error) {
      // Revert on failure
      setShipping((prev) => (prev ? { ...prev, enabled: !next } : prev));
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update shipping charge"
      );
    } finally {
      setSaving(false);
    }
  };

  const enabled = shipping?.enabled ?? false;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform-wide configuration for the storefront and checkout.
        </p>
      </header>

      <section className="border border-border-soft bg-card p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex gap-4">
            <div className="mt-0.5 text-gold">
              <Truck className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-medium text-foreground">
                Shipping Charge
              </h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                When enabled, a flat shipping fee of{" "}
                <span className="font-medium text-foreground">
                  ₹{shipping?.amount ?? 180}
                </span>{" "}
                is added to every order at checkout. Turn it off to offer free
                shipping — new orders will not be charged.
              </p>
              <div className="mt-3">
                {loading ? (
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    Loading…
                  </span>
                ) : (
                  <span
                    className={
                      "inline-flex items-center gap-2 border px-2 py-1 text-xs font-medium uppercase tracking-wider " +
                      (enabled
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
                        : "border-border-soft bg-cream text-muted-foreground")
                    }
                  >
                    <span
                      className={
                        "h-2 w-2 rounded-full " +
                        (enabled ? "bg-emerald-500" : "bg-muted-foreground/50")
                      }
                    />
                    {enabled ? "Active" : "Free shipping"}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant={enabled ? "outline" : "primary"}
            disabled={loading || saving}
            onClick={() => handleToggle(!enabled)}
            className="shrink-0"
          >
            {saving
              ? "Saving…"
              : enabled
                ? "Stop charge"
                : "Start charge"}
          </Button>
        </div>
      </section>
    </div>
  );
}
