import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { PublicLayoutShell } from "@/components/layout/PublicLayoutShell";
import { Toaster } from "@/components/ui/sonner";
import { GlobalLoader } from "@/components/global-loader";

/**
 * Inter - Body text, UI elements
 * Clean, modern, highly legible
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Cormorant Garamond - Display headings
 * Elegant, editorial, luxury feel
 */
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TatVivah | Premium Indian Fashion",
  description: "Discover curated men's ethnic wear and wedding fashion from verified sellers. A trusted multi-vendor marketplace for premium Indian clothing.",
  keywords: ["Indian fashion", "ethnic wear", "wedding fashion", "men's clothing", "kurta", "sherwani"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        {/* Preconnect to critical origins to cut DNS/TLS latency */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://ik.imagekit.io" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
  try {
    const stored = localStorage.getItem('tatvivah-theme');
    const theme = stored ?? 'light';
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = theme;
  } catch (_) {}
})();`,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${cormorant.variable} min-h-screen bg-background text-foreground antialiased`}
      >
        <GlobalLoader />
        <Toaster />
        <PublicLayoutShell>{children}</PublicLayoutShell>
      </body>
    </html>
  );
}
