"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { loginUser, persistAuthCookies, requestAuthOtp } from "@/services/auth";
import { toast } from "sonner";
import {
  getSubdomain,
  SUBDOMAIN_ALLOWED_ROLES,
  getCorrectLoginUrl,
  type SubdomainType,
} from "@/lib/subdomain";

interface LoginContent {
  eyebrow: string;
  headingLine1: string;
  headingLine2: string;
  description: string;
  features: string[];
  cardTitle: string;
  cardDescription: string;
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
    registerText: null,
    registerLabel: null,
    registerHref: null,
    successToast: "Welcome back to the admin panel.",
  },
};

function detectInputType(value: string): "phone" | "email" | "unknown" {
  const trimmed = value.trim();
  if (!trimmed) return "unknown";
  if (trimmed.includes("@")) return "email";
  if (/^[+\d][\d\s\-()+]*$/.test(trimmed)) return "phone";
  if (/[a-zA-Z]/.test(trimmed)) return "email";
  return "unknown";
}

export default function LoginPage() {
  const router = useRouter();
  const [subdomain, setSubdomain] = React.useState<SubdomainType>("main");

  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [useOtp, setUseOtp] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setSubdomain(getSubdomain());
  }, []);

  const content = LOGIN_CONTENT[subdomain];
  const isMainPortal = subdomain === "main";
  const inputType = detectInputType(identifier);
  const identifierReady = inputType !== "unknown";

  // Reset OTP preference when detected type changes so UX stays clean
  React.useEffect(() => {
    setUseOtp(false);
    setPassword("");
  }, [inputType]);

  const isOtpMode = isMainPortal && useOtp && identifierReady;
  const showPasswordField = !isMainPortal || (identifierReady && !useOtp);

  const identifierLabel =
    isMainPortal
      ? inputType === "phone"
        ? "Mobile Number"
        : inputType === "email"
          ? "Email Address"
          : "Mobile Number or Email"
      : "Email or Mobile";

  const identifierPlaceholder =
    isMainPortal
      ? inputType === "phone"
        ? "9876543210"
        : inputType === "email"
          ? "you@email.com"
          : "9876543210 or you@email.com"
      : "you@email.com or 9876543210";

  const cardDescription =
    isMainPortal
      ? isOtpMode
        ? inputType === "phone"
          ? "We'll send a one-time code to your mobile number."
          : "We'll send a one-time code to your email address."
        : identifierReady
          ? "Enter your password below, or choose to login with OTP."
          : "Enter your mobile number or email address to continue."
      : content.cardDescription;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = identifier.trim();

    if (!trimmed) {
      toast.error("Enter your mobile number or email address.");
      return;
    }

    setLoading(true);
    try {
      if (isOtpMode) {
        if (inputType === "phone") {
          await requestAuthOtp({ phone: trimmed });
          toast.success("OTP sent to your mobile number.");
          router.replace(`/verify-otp?method=phone&phone=${encodeURIComponent(trimmed)}`);
        } else {
          await requestAuthOtp({ email: trimmed });
          toast.success("OTP sent to your email address.");
          router.replace(`/verify-otp?method=email&email=${encodeURIComponent(trimmed)}`);
        }
        return;
      }

      if (!password) {
        toast.error("Enter your password to continue.");
        return;
      }

      const result = await loginUser({ identifier: trimmed, password });
      const role = result.user.role?.toUpperCase();
      const allowedRoles = SUBDOMAIN_ALLOWED_ROLES[subdomain];

      if (!allowedRoles.includes(role)) {
        const portalLabel = subdomain === "main" ? "customer" : subdomain;
        const correctUrl = getCorrectLoginUrl(role);
        toast.error(`This portal is for ${portalLabel} accounts only. Redirecting...`);
        window.location.replace(correctUrl);
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

      router.replace(redirectMap[role] ?? "/");
    } catch (error) {
      console.error("Login error:", error);
      const message = error instanceof Error ? error.message : "Invalid credentials";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] bg-background">
      <div className="mx-auto flex min-h-[calc(100vh-160px)] max-w-6xl flex-col items-center justify-center gap-16 px-6 py-16 lg:flex-row lg:gap-24">
        {/* Left Section – Editorial */}
        <div className="flex-1 max-w-md lg:max-w-lg">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold mb-6">
            {content.eyebrow}
          </p>

          <h1 className="font-serif text-4xl font-light tracking-tight text-foreground sm:text-5xl lg:text-6xl mb-6">
            {content.headingLine1}
            <br />
            <span className="italic">{content.headingLine2}</span>
          </h1>

          <p className="text-base leading-relaxed text-muted-foreground mb-8">
            {content.description}
          </p>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {content.features.map((feature) => (
              <span key={feature} className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-gold" />
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="w-full max-w-md">
          <Card className="border-border-soft">
            <CardHeader className="space-y-3 pb-6">
              <CardTitle className="font-serif text-2xl font-normal">
                {content.cardTitle}
              </CardTitle>
              <CardDescription>{cardDescription}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* Unified identifier input – auto-detects phone vs email */}
                <div className="space-y-2">
                  <Label htmlFor="identifier">{identifierLabel}</Label>
                  <Input
                    id="identifier"
                    type={isMainPortal && inputType === "phone" ? "tel" : "text"}
                    inputMode={isMainPortal && inputType === "phone" ? "numeric" : undefined}
                    placeholder={identifierPlaceholder}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    autoComplete={isMainPortal && inputType === "phone" ? "tel" : "username"}
                    autoFocus
                  />
                </div>

                {/* Password field – shown once identifier type is known and not in OTP mode */}
                {showPasswordField && (
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

                    {/* OTP toggle – only for user portal */}
                    {isMainPortal && identifierReady && (
                      <button
                        type="button"
                        onClick={() => setUseOtp(true)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-300 underline underline-offset-2"
                      >
                        Login with OTP instead
                      </button>
                    )}
                  </div>
                )}

                {/* Password toggle when in OTP mode */}
                {isOtpMode && (
                  <button
                    type="button"
                    onClick={() => setUseOtp(false)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-300 underline underline-offset-2 -mt-2 block"
                  >
                    Use password instead
                  </button>
                )}

                {/* Remember me + Forgot password */}
                {showPasswordField && !isOtpMode && (
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
                )}

                <Button className="w-full" size="lg" disabled={loading}>
                  {loading
                    ? isOtpMode
                      ? "Sending OTP..."
                      : "Signing In..."
                    : isOtpMode
                      ? "Send OTP"
                      : "Sign In"}
                </Button>
              </form>

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
        </div>
      </div>
    </div>
  );
}
