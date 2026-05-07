"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestAuthOtp, verifyAuthOtp, persistAuthCookies } from "@/services/auth";
import { toast } from "sonner";
import { heroContainerVariants, heroItemVariants } from "@/lib/motion.config";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefill = searchParams.get("email") ?? "";

  const [identifier, setIdentifier] = React.useState(prefill);
  const [otp, setOtp] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const submittedOtpRef = React.useRef<string | null>(null);

  // Email-only OTP flow; browser SMS OTP autofill not used.

  const handleVerify = React.useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!identifier || !otp) {
      console.warn("[auth-ui][verify-otp] blocked submit", { hasEmail: Boolean(identifier), hasOtp: Boolean(otp) });
      toast.error("Enter email and OTP.");
      return;
    }

    setLoading(true);
    try {
      console.info("[auth-ui][verify-otp] submit", { email: identifier, otpLength: otp.length });
      const result = await verifyAuthOtp({ email: identifier, otp });
      if (result.accessToken && result.refreshToken && result.user) {
        persistAuthCookies(result.accessToken, result.refreshToken, result.user);

        toast.success("Email verified successfully.");

        const role = result.user.role?.toUpperCase();
        const redirectMap: Record<string, string> = {
          ADMIN: "/admin/dashboard",
          SUPER_ADMIN: "/admin/dashboard",
          SELLER: "/seller/dashboard",
          USER: "/user/dashboard",
        };

        router.push(redirectMap[role] ?? "/");
      } else {
        toast.success(result.message ?? `Email verified. Await admin approval.`);
        router.push("/login");
      }
    } catch (error) {
      console.error("[auth-ui][verify-otp] failed", error);
      toast.error(error instanceof Error ? error.message : "OTP failed");
    } finally {
      setLoading(false);
    }
  }, [identifier, otp, router]);

  const handleResend = async () => {
    if (!identifier) {
      console.warn("[auth-ui][verify-otp] resend blocked", { hasEmail: false });
      toast.error(`Enter your email address first.`);
      return;
    }
    setSending(true);
    try {
      console.info("[auth-ui][verify-otp] resend", { email: identifier });
      await requestAuthOtp({ email: identifier });
      toast.success(`OTP sent to your email address.`);
    } catch (error) {
      console.error("[auth-ui][verify-otp] resend failed", error);
      toast.error(error instanceof Error ? error.message : "OTP request failed");
    } finally {
      setSending(false);
    }
  };

  React.useEffect(() => {
    if (otp.length !== 6 || loading || submittedOtpRef.current === otp) {
      return;
    }
    submittedOtpRef.current = otp;
    void handleVerify({ preventDefault() {} } as React.FormEvent<HTMLFormElement>);
  }, [handleVerify, otp]); // loading intentionally omitted: submittedOtpRef prevents double-submit after failure

  return (
    <div className="min-h-[calc(100vh-160px)] bg-background">
      <div className="mx-auto flex min-h-[calc(100vh-160px)] max-w-5xl flex-col items-center justify-center gap-14 px-6 py-16 lg:flex-row lg:gap-24">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={heroContainerVariants}
          className="flex-1 max-w-md lg:max-w-lg"
        >
          <motion.p
            variants={heroItemVariants}
            className="text-xs font-medium uppercase tracking-[0.3em] text-gold mb-6"
          >
            Verify Account
          </motion.p>
          <motion.h1
            variants={heroItemVariants}
            className="font-serif text-4xl font-light tracking-tight text-foreground sm:text-5xl mb-6"
          >
            Confirm your
            <br />
            <span className="italic">email address</span>.
          </motion.h1>
          <motion.p
            variants={heroItemVariants}
            className="text-base leading-relaxed text-muted-foreground"
          >
            We sent a 6-digit OTP to your email address. Enter it below to continue with your account.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-md"
        >
          <Card className="border-border-soft">
            <CardHeader className="space-y-3 pb-6">
              <CardTitle className="font-serif text-2xl font-normal">
                Verify OTP
              </CardTitle>
              <CardDescription>
                Enter your email address and OTP to continue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <form className="space-y-5" onSubmit={handleVerify}>
                <div className="space-y-2">
                  <Label htmlFor="identifier">Email address</Label>
                  <Input
                    id="identifier"
                    placeholder="you@email.com"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    disabled={Boolean(prefill)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otp">OTP</Label>
                  <Input
                    id="otp"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    autoComplete={undefined}
                    inputMode="numeric"
                  />
                </div>
                <Button className="w-full" size="lg" disabled={loading}>
                  {loading ? "Verifying..." : "Verify & Continue"}
                </Button>
              </form>
              <Button
                variant="outline"
                className="w-full"
                disabled={sending}
                onClick={handleResend}
              >
                {sending ? "Sending OTP..." : "Resend OTP"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <React.Suspense fallback={null}>
      <VerifyOtpContent />
    </React.Suspense>
  );
}
