import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { SITE_URL } from "@/lib/site-config";
import { NavigationProgress } from "@/components/navigation/NavigationProgress";

/**
 * Inter - Body text, UI elements
 * Clean, modern, highly legible
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

const API_ORIGIN = (() => {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) return null;
  try {
    return new URL(base).origin;
  } catch {
    return null;
  }
})();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TatVivah | Best Ethnic Wear for Men in India | Sherwani, Kurta, Indo Western",
    template: "%s | TatVivah",
  },
  description:
    "Shop the best ethnic wear for men in India. Explore premium sherwani, kurta sets, Indo-Western outfits, wedding wear, festive outfits and groom collections from top designers.",
  keywords: [
    "ethnic wear for men india",
    "sherwani for wedding",
    "kurta set for men",
    "indo western for men",
    "groom wedding outfits",
    "mehendi kurta set",
    "sangeet outfit men",
    "wedding sherwani india",
  ],
  openGraph: {
    title: "TatVivah | Best Ethnic Wear for Men in India | Sherwani, Kurta, Indo Western",
    description:
      "Shop the best ethnic wear for men in India. Explore premium sherwani, kurta sets, Indo-Western outfits, wedding wear, festive outfits and groom collections from top designers.",
    siteName: "TatVivah",
    url: SITE_URL,
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "TatVivah - Best Ethnic Wear for Men in India",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TatVivah | Best Ethnic Wear for Men in India",
    description:
      "Shop premium sherwani, kurta sets, Indo-Western outfits and wedding collections for men from top designers in India.",
    images: ["/logo.png"],
  },
  icons: {
    icon: [
      { url: "/tatvivah-logo.svg", type: "image/svg+xml" },
      { url: "/favicon-64.png", type: "image/png", sizes: "64x64" },
    ],
    shortcut: "/favicon-64.png",
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f6" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1818" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        {/* Preconnect to critical external origins to cut DNS/TLS latency */}
        <link rel="preconnect" href="https://ik.imagekit.io" />
        {API_ORIGIN && <link rel="preconnect" href={API_ORIGIN} />}
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
  try {
    const key = 'tatvivah-theme';
    const stored = localStorage.getItem(key);
    const isDark = stored === 'dark';
    if (!stored) {
      localStorage.setItem(key, 'light');
    }
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  } catch (_) {}
})();`,
          }}
        />
      </head>
      <body
        className={`${inter.variable} min-h-screen bg-background text-foreground antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "TatVivah",
              url: SITE_URL,
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${SITE_URL}/marketplace?search={search_term_string}`
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        {children}
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
      </body>
    </html>
  );
}
