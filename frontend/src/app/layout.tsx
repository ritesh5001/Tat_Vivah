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
  metadataBase: new URL("https://tatvivah.com"),
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
    url: "https://tatvivah.com",
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
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
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
