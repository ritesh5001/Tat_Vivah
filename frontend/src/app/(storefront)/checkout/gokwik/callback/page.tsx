"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { verifyGoKwikPayment } from "@/services/payments";

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 20; // ~60s of PENDING before we hand off to the webhook

type Phase = "verifying" | "success" | "failed" | "pending";

function GoKwikCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // GoKwik's hosted link doesn't guarantee a return query param, so fall back
  // to the order id we stashed before redirecting.
  const [orderId] = React.useState<string | null>(() => {
    const fromQuery = searchParams.get("orderId");
    if (fromQuery) return fromQuery;
    if (typeof window === "undefined") return null;
    try {
      return window.sessionStorage.getItem("tatvivah_pending_order");
    } catch {
      return null;
    }
  });

  const [phase, setPhase] = React.useState<Phase>("verifying");
  const [message, setMessage] = React.useState("Confirming your payment with GoKwik…");

  React.useEffect(() => {
    if (!orderId) {
      setPhase("failed");
      setMessage("Missing order reference. Please check your orders.");
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const clearPending = () => {
      try {
        window.sessionStorage.removeItem("tatvivah_pending_order");
      } catch {
        // ignore
      }
    };

    const check = async () => {
      try {
        const result = await verifyGoKwikPayment(orderId);
        if (cancelled) return;

        if (result.data.status === "SUCCESS") {
          clearPending();
          setPhase("success");
          setMessage("Payment successful. Your order is confirmed.");
          setTimeout(() => {
            if (!cancelled) router.push("/user/dashboard");
          }, 2500);
          return;
        }

        if (result.data.status === "FAILED") {
          clearPending();
          setPhase("failed");
          setMessage("Payment failed. You can retry from your orders.");
          return;
        }

        attempts += 1;
        if (attempts >= MAX_POLLS) {
          setPhase("pending");
          setMessage(
            "Your payment is still being processed. We'll confirm it shortly — check your orders for the latest status."
          );
          return;
        }
        setTimeout(() => {
          if (!cancelled) void check();
        }, POLL_INTERVAL_MS);
      } catch (error) {
        if (cancelled) return;
        setPhase("failed");
        setMessage(
          error instanceof Error ? error.message : "Payment verification failed."
        );
      }
    };

    void check();

    return () => {
      cancelled = true;
    };
  }, [orderId, router]);

  return (
    <div className="min-h-[calc(100vh-160px)] bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-border-soft bg-card p-10 text-center space-y-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
          Payment
        </p>

        {phase === "verifying" && (
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        )}
        {phase === "success" && (
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-600/10 text-2xl text-green-600">
            ✓
          </span>
        )}
        {phase === "failed" && (
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-600/10 text-2xl text-red-600">
            ✕
          </span>
        )}
        {phase === "pending" && (
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-2xl text-gold">
            ⏳
          </span>
        )}

        <h1 className="font-serif text-2xl font-light tracking-tight text-foreground">
          {phase === "verifying"
            ? "Verifying Payment"
            : phase === "success"
              ? "Payment Confirmed"
              : phase === "failed"
                ? "Payment Not Completed"
                : "Payment Processing"}
        </h1>

        <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>

        {phase !== "verifying" && (
          <div className="flex flex-col gap-3">
            <Button size="lg" onClick={() => router.push("/user/orders")}>
              View My Orders
            </Button>
            {phase === "success" && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push("/user/dashboard")}
              >
                Go to Dashboard
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GoKwikCallbackPage() {
  return (
    <React.Suspense fallback={null}>
      <GoKwikCallbackContent />
    </React.Suspense>
  );
}
