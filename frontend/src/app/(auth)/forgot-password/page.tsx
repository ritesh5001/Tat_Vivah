"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { forgotPassword } from "@/services/auth";
import { toast } from "sonner";
import { heroContainerVariants, heroItemVariants } from "@/lib/motion.config";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email);
      toast.success("If an account exists, an OTP has been sent to your email.");
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] bg-background">
      <div className="mx-auto flex min-h-[calc(100vh-160px)] max-w-6xl flex-col items-center justify-center gap-16 px-6 py-16 lg:flex-row lg:gap-24">
        {/* Left Section - Editorial */}
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
            Account Recovery
          </motion.p>

          <motion.h1
            variants={heroItemVariants}
            className="font-serif text-4xl font-light tracking-tight text-foreground sm:text-5xl lg:text-6xl mb-6"
          >
            Reset Your
            <br />
            <span className="italic">Password</span>
          </motion.h1>

          <motion.p
            variants={heroItemVariants}
            className="text-base leading-relaxed text-muted-foreground mb-8"
          >
            Enter the email address associated with your account and we&apos;ll
            send you a one-time code to set a new password.
          </motion.p>

          <motion.div
            variants={heroItemVariants}
            className="flex items-center gap-4 text-xs text-muted-foreground"
          >
            <span className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-gold" />
              Secure Reset
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-gold" />
              OTP Verified
            </span>
          </motion.div>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: 0.3,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className="w-full max-w-md"
        >
          <Card className="border-border-soft">
            <CardHeader className="space-y-3 pb-6">
              <CardTitle className="font-serif text-2xl font-normal">
                Forgot Password
              </CardTitle>
              <CardDescription>
                We&apos;ll send a 6-digit OTP to your registered email.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>

                <Button className="w-full" size="lg" disabled={loading}>
                  {loading ? "Sending OTP..." : "Send Reset OTP"}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link
                  className="text-foreground hover:text-gold transition-colors duration-300"
                  href="/login"
                >
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
