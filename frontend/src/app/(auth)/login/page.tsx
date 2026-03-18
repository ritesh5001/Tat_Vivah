"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import { loginUser, persistAuthCookies } from "@/services/auth";
import { toast } from "sonner";
import { heroContainerVariants, heroItemVariants } from "@/lib/motion.config";
import {
  getSubdomain,
  SUBDOMAIN_ALLOWED_ROLES,
  getCorrectLoginUrl,
  type SubdomainType,
} from "@/lib/subdomain";

/* ── Subdomain-specific content ── */

interface LoginContent {
  eyebrow: string;
  headingLine1: string;
  headingLine2: string;
  description: string;
  features: string[];
  cardTitle: string;
  cardDescription: string;
  showSocial: boolean;
  registerText: string | null;
  registerLabel: string | null;
  registerHref: string | null;
  successToast: string;
}

const LOGIN_CONTENT: Record<SubdomainType, LoginContent> = {
  main: {
    eyebrow: "Welcome Back",
    headingLine1: "Continue Your",
    headingLine2: "Journey",
    description:
      "Access your curated collections, track orders, and discover new pieces crafted for the modern gentleman.",
    features: ["Secure Login", "Verified Profiles"],
    cardTitle: "Sign In",
    cardDescription: "Use your TatVivah credentials to access your account.",
    showSocial: true,
    registerText: "New here?",
    registerLabel: "Create an account",
    registerHref: "/register/user",
    successToast: "Welcome back to TatVivah.",
  },
  seller: {
    eyebrow: "Welcome Back, Seller",
    headingLine1: "Your Seller",
    headingLine2: "Dashboard",
    description:
      "Manage your catalog, track orders, and grow your business with TatVivah's dedicated seller tools.",
    features: ["Seller Portal", "Secure Access"],
    cardTitle: "Seller Sign In",
    cardDescription: "Login to your seller dashboard.",
    showSocial: false,
    registerText: "New seller?",
    registerLabel: "Register your business",
    registerHref: "/register/seller",
    successToast: "Welcome back to your seller dashboard.",
  },
  admin: {
    eyebrow: "Welcome Back, Admin",
    headingLine1: "Admin",
    headingLine2: "Panel",
    description:
      "Access the platform administration panel to manage users, orders, and system configuration.",
    features: ["Admin Access", "Restricted Portal"],
    cardTitle: "Admin Sign In",
    cardDescription: "Login with your admin credentials.",
    showSocial: false,
    registerText: null,
    registerLabel: null,
    registerHref: null,
    successToast: "Welcome back to the admin panel.",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const [subdomain, setSubdomain] = React.useState<SubdomainType>("main");

  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setSubdomain(getSubdomain());
  }, []);

  const content = LOGIN_CONTENT[subdomain];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!identifier || !password) {
      toast.error("Enter email/phone and password to continue.");
      return;
    }

    setLoading(true);
    try {
      const result = await loginUser({ identifier, password });

      const role = result.user.role?.toUpperCase();
      const allowedRoles = SUBDOMAIN_ALLOWED_ROLES[subdomain];

      // Validate role matches current subdomain
      if (!allowedRoles.includes(role)) {
        const portalLabel =
          subdomain === "main" ? "customer" : subdomain;
        const correctUrl = getCorrectLoginUrl(role);
        toast.error(
          `This portal is for ${portalLabel} accounts only. Redirecting you to the correct login page.`
        );
        setTimeout(() => {
          window.location.assign(correctUrl);
        }, 2000);
        return;
      }

      persistAuthCookies(result.accessToken, result.refreshToken, result.user);

      toast.success(content.successToast);

      const redirectMap: Record<string, string> = {
        ADMIN: "/admin/dashboard",
        SUPER_ADMIN: "/admin/dashboard",
        SELLER: "/seller/dashboard",
        USER: "/user/dashboard",
      };

      router.push(redirectMap[role] ?? "/");
    } catch (error) {
      console.error("Login error:", error);
      const message = error instanceof Error ? error.message : "Invalid credentials";
      if (message.toLowerCase().includes("verification")) {
        toast.error("Please verify your email to continue.");
        if (identifier.includes("@")) {
          router.push(`/verify-otp?email=${encodeURIComponent(identifier)}`);
        } else {
          router.push("/verify-otp");
        }
      } else {
        toast.error(message);
      }
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
            {content.eyebrow}
          </motion.p>

          <motion.h1
            variants={heroItemVariants}
            className="font-serif text-4xl font-light tracking-tight text-foreground sm:text-5xl lg:text-6xl mb-6"
          >
            {content.headingLine1}
            <br />
            <span className="italic">{content.headingLine2}</span>
          </motion.h1>

          <motion.p
            variants={heroItemVariants}
            className="text-base leading-relaxed text-muted-foreground mb-8"
          >
            {content.description}
          </motion.p>

          <motion.div
            variants={heroItemVariants}
            className="flex items-center gap-4 text-xs text-muted-foreground"
          >
            {content.features.map((feature) => (
              <span key={feature} className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-gold" />
                {feature}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-md"
        >
          <Card className="border-border-soft">
            <CardHeader className="space-y-3 pb-6">
              <CardTitle className="font-serif text-2xl font-normal">
                {content.cardTitle}
              </CardTitle>
              <CardDescription>
                {content.cardDescription}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* Identifier */}
                <div className="space-y-2">
                  <Label htmlFor="identifier">Email or Mobile</Label>
                  <Input
                    id="identifier"
                    placeholder="you@email.com or 9876543210"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    autoComplete="username"
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-300"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded-sm border-border-soft accent-gold"
                    />
                    Remember me
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-muted-foreground hover:text-foreground transition-colors duration-300"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button className="w-full" size="lg" disabled={loading}>
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
              </form>

              {content.showSocial && (
                <>
                  <Separator />

                  <div className="grid gap-3">
                    <Button variant="outline" size="lg" className="w-full">
                      Continue with Google
                    </Button>
                    <Button variant="outline" size="lg" className="w-full">
                      Continue with Apple
                    </Button>
                  </div>
                </>
              )}

              {content.registerText && content.registerHref && (
                <p className="text-center text-sm text-muted-foreground">
                  {content.registerText}{" "}
                  <Link
                    className="text-foreground hover:text-gold transition-colors duration-300"
                    href={content.registerHref}
                    prefetch={content.registerHref !== "/register/seller"}
                  >
                    {content.registerLabel}
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
