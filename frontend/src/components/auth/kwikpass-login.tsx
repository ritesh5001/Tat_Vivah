"use client";

/**
 * KwikPass phone + OTP login.
 *
 * The GoKwik SDK owns OTP delivery and verification; on success it returns a
 * `kpToken` (a JWE) which we hand to our backend. The backend decrypts it and
 * issues our own session tokens — the browser never asserts the phone number.
 *
 * SDK surface (per GoKwik's custom-headless guide):
 *   kpSendOTP(phone)        → { status, body, message }
 *   kpVerifyOTP(phone, otp) → { status, body: { kpToken, ... }, message }
 *   handleKPLogout()        → clears KwikPass session
 *   'kwikpass-sso' event    → returning shopper recognised, carries kpToken
 */

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginWithKwikPass, persistAuthCookies } from "@/services/auth";
import { isKwikPassEnabled } from "./kwikpass-provider";

type KwikPassResult = {
  status: number;
  message?: string;
  body?: Record<string, unknown> & { kpToken?: string };
};

type KwikPassSdk = {
  kpSendOTP?: (phone: string) => Promise<KwikPassResult>;
  kpVerifyOTP?: (phone: string, otp: string) => Promise<KwikPassResult>;
  handleKPLogout?: () => void;
};

function getSdk(): KwikPassSdk | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { __KP_LOGIN_SDK_INSTANCE__?: KwikPassSdk })
    .__KP_LOGIN_SDK_INSTANCE__ ?? null;
}

interface KwikPassLoginProps {
  /** Where to send the buyer after a successful login. */
  redirectTo?: string;
  onSuccess?: () => void;
}

export function KwikPassLogin({
  redirectTo = "/user/dashboard",
  onSuccess,
}: KwikPassLoginProps) {
  const [phone, setPhone] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [step, setStep] = React.useState<"phone" | "otp">("phone");
  const [busy, setBusy] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (!isKwikPassEnabled()) return;

    const markReady = () => setReady(true);
    if (getSdk()?.kpSendOTP) {
      markReady();
    }
    window.addEventListener("kp-script-loaded", markReady);
    return () => window.removeEventListener("kp-script-loaded", markReady);
  }, []);

  /** Exchange a kpToken for our session and land the user. */
  const completeLogin = React.useCallback(
    async (kpToken: string) => {
      const result = await loginWithKwikPass(kpToken);
      persistAuthCookies(result.accessToken, result.refreshToken, result.user);
      toast.success("Signed in successfully.");
      onSuccess?.();
      window.location.assign(redirectTo);
    },
    [onSuccess, redirectTo]
  );

  // Returning shoppers are recognised by KwikPass and log in without an OTP.
  React.useEffect(() => {
    if (!isKwikPassEnabled()) return;

    const handleSso = async (event: Event) => {
      const kpToken = (event as CustomEvent<{ kpToken?: string }>).detail?.kpToken;
      if (!kpToken) return;
      try {
        setBusy(true);
        await completeLogin(kpToken);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not sign you in."
        );
      } finally {
        setBusy(false);
      }
    };

    window.addEventListener("kwikpass-sso", handleSso);
    return () => window.removeEventListener("kwikpass-sso", handleSso);
  }, [completeLogin]);

  if (!isKwikPassEnabled()) {
    return null;
  }

  const normalizedPhone = phone.replace(/\D/g, "").slice(-10);

  const handleSendOtp = async () => {
    if (!/^\d{10}$/.test(normalizedPhone)) {
      toast.error("Enter a valid 10-digit mobile number.");
      return;
    }

    const sdk = getSdk();
    if (!sdk?.kpSendOTP) {
      toast.error("Login is still loading. Please try again in a moment.");
      return;
    }

    setBusy(true);
    try {
      const result = await sdk.kpSendOTP(normalizedPhone);
      // Per the docs, anything other than 200/400 is an unexpected error.
      if (result.status === 200) {
        setStep("otp");
        toast.success("OTP sent to your mobile.");
      } else {
        toast.error(result.message ?? "Could not send OTP. Please try again.");
      }
    } catch {
      toast.error("Could not send OTP. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.trim().length < 4) {
      toast.error("Enter the OTP sent to your mobile.");
      return;
    }

    const sdk = getSdk();
    if (!sdk?.kpVerifyOTP) {
      toast.error("Login is still loading. Please try again in a moment.");
      return;
    }

    setBusy(true);
    try {
      const result = await sdk.kpVerifyOTP(normalizedPhone, otp.trim());
      if (result.status !== 200 || !result.body?.kpToken) {
        toast.error(result.message ?? "Incorrect OTP. Please try again.");
        return;
      }
      await completeLogin(result.body.kpToken);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not sign you in."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {step === "phone" ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="kwikpass-phone">Mobile Number</Label>
            <Input
              id="kwikpass-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="98765 43210"
              value={phone}
              maxLength={14}
              onChange={(event) => setPhone(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleSendOtp();
              }}
              disabled={busy}
            />
          </div>
          <Button
            className="w-full h-12"
            onClick={handleSendOtp}
            disabled={busy || !ready}
          >
            {busy ? "Sending OTP…" : ready ? "Continue with OTP" : "Loading…"}
          </Button>
        </>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="kwikpass-otp">Enter OTP</Label>
            <Input
              id="kwikpass-otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="1234"
              value={otp}
              maxLength={6}
              onChange={(event) =>
                setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleVerifyOtp();
              }}
              disabled={busy}
            />
            <p className="text-xs text-muted-foreground">
              Sent to {normalizedPhone}.{" "}
              <button
                type="button"
                className="text-gold underline underline-offset-2"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                }}
                disabled={busy}
              >
                Change
              </button>
            </p>
          </div>
          <Button className="w-full h-12" onClick={handleVerifyOtp} disabled={busy}>
            {busy ? "Verifying…" : "Verify & Sign In"}
          </Button>
        </>
      )}

      <p className="text-center text-[10px] text-muted-foreground">
        Powered by KwikPass
      </p>
    </div>
  );
}
