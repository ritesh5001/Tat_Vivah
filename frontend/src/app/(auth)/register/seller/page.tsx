"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
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
import { registerSeller } from "@/services/auth";
import { toast } from "sonner";
import { heroContainerVariants, heroItemVariants } from "@/lib/motion.config";

export default function SellerRegisterPage() {
  const theme = {
    page: "relative min-h-[calc(100vh-160px)] overflow-hidden bg-gradient-to-br from-cream via-ivory to-background",
    texture: "pointer-events-none absolute inset-0 opacity-50",
    shell: "relative z-10 mx-auto flex min-h-[calc(100vh-160px)] max-w-6xl flex-col items-center justify-center gap-16 px-6 py-16 lg:flex-row lg:gap-24",
    eyebrow: "text-xs font-medium uppercase tracking-[0.3em] text-gold mb-6",
    heading: "font-serif text-4xl font-light tracking-tight text-brown sm:text-5xl mb-6",
    headingAccent: "italic text-charcoal",
    body: "text-base leading-relaxed text-brown/80 mb-8",
    featureItem: "flex items-center gap-3 text-sm text-brown/80",
    card: "border-gold/25 bg-card/95 shadow-lg shadow-gold/10 hover:border-gold/40",
    cardTitle: "font-serif text-2xl font-normal text-brown",
    cardDescription: "text-brown/70",
    label: "text-brown/85",
    input:
      "border-border-soft/90 bg-ivory/80 text-brown placeholder:text-brown/50 focus-visible:border-gold/60 focus-visible:ring-gold/30",
    toggle:
      "absolute right-4 top-1/2 -translate-y-1/2 text-brown/60 hover:text-brown transition-colors duration-300",
    button:
      "w-full border border-gold/30 bg-brown text-ivory hover:bg-charcoal hover:shadow-lg hover:shadow-gold/20 hover:-translate-y-0.5",
    footer: "text-center text-sm text-brown/70",
    link: "text-brown hover:text-gold transition-colors duration-300",
  } as const;

  const fadeInUp = (index: number) => ({
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.45,
      delay: 0.2 + index * 0.05,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  });

  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [whatsappNumber, setWhatsappNumber] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !phone || !whatsappNumber || !password) {
      toast.error("Please fill all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await registerSeller({ email, phone, whatsappNumber, password });
      toast.success("OTP sent to your mobile number.");
      window.location.href = `/verify-otp?phone=${encodeURIComponent(phone)}`;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={theme.page}>
      <div className={theme.texture} aria-hidden>
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-gold/10 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-brown/10 to-transparent" />
      </div>

      <div className={theme.shell}>
        {/* Left Section - Editorial */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={heroContainerVariants}
          className="flex-1 max-w-md lg:max-w-lg"
        >
          <motion.p
            variants={heroItemVariants}
            className={theme.eyebrow}
          >
            Seller Registration
          </motion.p>

          <motion.h1
            variants={heroItemVariants}
            className={theme.heading}
          >
            Grow your
            <br />
            <span className={theme.headingAccent}>business</span> with us.
          </motion.h1>

          <motion.p
            variants={heroItemVariants}
            className={theme.body}
          >
            Join trusted vendors across India. Manage your catalog, appointments,
            and payments with dedicated seller tools built for craftsmen.
          </motion.p>

          <motion.div
            variants={heroItemVariants}
            className="grid gap-3 sm:grid-cols-2"
          >
            {[
              "Dedicated seller dashboard",
              "Instant payout tracking",
              "Priority support team",
              "Verified vendor badge",
            ].map((item) => (
              <div
                key={item}
                className={theme.featureItem}
              >
                <span className="h-1 w-1 rounded-full bg-gold" />
                {item}
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-md"
        >
          <Card className={theme.card}>
            <CardHeader className="space-y-3 pb-6">
              <CardTitle className={theme.cardTitle}>
                Register Your Business
              </CardTitle>
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "5rem", opacity: 1 }}
                transition={{ duration: 0.45, delay: 0.45, ease: "easeOut" }}
                className="h-px bg-gold"
              />
              <CardDescription className={theme.cardDescription}>
                Provide business details to create a seller account on TatVivah.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <form className="space-y-5" onSubmit={handleSubmit}>
                <motion.div className="space-y-2" {...fadeInUp(0)}>
                  <Label htmlFor="email" className={theme.label}>Business Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="owner@brand.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={theme.input}
                  />
                </motion.div>
                <motion.div className="space-y-2" {...fadeInUp(1)}>
                  <Label htmlFor="phone" className={theme.label}>Contact Number</Label>
                  <Input
                    id="phone"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className={theme.input}
                  />
                </motion.div>
                <motion.div className="space-y-2" {...fadeInUp(2)}>
                  <Label htmlFor="whatsappNumber" className={theme.label}>WhatsApp Number</Label>
                  <Input
                    id="whatsappNumber"
                    placeholder="9876543210"
                    value={whatsappNumber}
                    onChange={(event) => setWhatsappNumber(event.target.value.replace(/[^0-9]/g, ""))}
                    className={theme.input}
                  />
                </motion.div>
                <motion.div className="grid gap-4 sm:grid-cols-2" {...fadeInUp(3)}>
                  <div className="space-y-2">
                    <Label htmlFor="password" className={theme.label}>Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min 8 chars"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className={theme.input}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className={theme.toggle}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm" className={theme.label}>Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm"
                        type={showConfirm ? "text" : "password"}
                        placeholder="Re-enter"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        className={theme.input}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((value) => !value)}
                        className={theme.toggle}
                      >
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </motion.div>
                <motion.div {...fadeInUp(4)}>
                  <Button className={theme.button} size="lg" disabled={loading}>
                  {loading ? "Submitting..." : "Create Seller Account"}
                  </Button>
                </motion.div>
              </form>
              <p className={theme.footer}>
                Already a seller?{" "}
                <Link
                  className={theme.link}
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
