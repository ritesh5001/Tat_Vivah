import type { Metadata } from "next";
import HomeClient from "@/components/home/HomeClient";
import type { MarketplaceCardProduct } from "@/components/marketplace-product-card";
import type { CategoryListResponse } from "@/services/catalog";
import type { BestsellerProduct } from "@/services/bestsellers";

export const metadata: Metadata = {
  title:
    "Best Ethnic Wear for Men in India | Sherwani, Kurta & Wedding Outfits",
  description:
    "Discover the best ethnic wear for men in India at TatVivah. Shop premium sherwani, kurta sets, Indo-Western outfits and wedding collections perfect for mehendi, sangeet, reception and festive occasions.",
  keywords: [
    "best ethnic wear india",
    "wedding kurta india",
    "sherwani india",
    "indo western india",
    "kurta set for men india",
    "wedding outfits india"
  ],
  alternates: {
    canonical: "https://tatvivahtrends.com",
  },
  openGraph: {
    title: "Best Ethnic Wear for Men in India | Sherwani, Kurta & Wedding Outfits | TatVivah",
    description:
      "Discover the best ethnic wear for men in India at TatVivah. Shop premium sherwani, kurta sets, Indo-Western outfits and wedding collections.",
    url: "https://tatvivahtrends.com",
    siteName: "TatVivah",
    type: "website",
    images: [
      {
        url: "/logo.png",
        alt: "TatVivah - Best Ethnic Wear for Men in India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Ethnic Wear for Men in India | TatVivah",
    description:
      "Shop premium sherwani, kurta sets, Indo-Western outfits and wedding collections at TatVivah.",
    images: ["/logo.png"],
  },
};

/* ── Organization JSON-LD ── */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TatVivah",
  url: "https://tatvivahtrends.com",
  logo: "https://tatvivahtrends.com/logo.png",
  sameAs: [
    "https://www.instagram.com/tatvivah",
    "https://www.facebook.com/tatvivah",
  ],
};

/* ── FAQ JSON-LD ── */
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is best ethnic wear in India?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The best ethnic wear for men in India includes designer Sherwanis, intricate Kurta Sets, and modern Indo-Western outfits. TatVivah curates premium traditional menswear crafted by master artisans for unparalleled quality."
      }
    },
    {
      "@type": "Question",
      name: "Where to buy sherwani online?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You can buy high-quality, authentic sherwanis online at TatVivah. We offer a curated marketplace featuring exclusive designs, luxury fabrics, and secure shipping across India."
      }
    },
    {
      "@type": "Question",
      name: "Best wedding kurta for men?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The best wedding kurta for men depends on the ceremony. For Haldi, a lightweight yellow cotton kurta is ideal, while a heavier silk or Chanderi kurta with mirror work or Zari embroidery suits a Sangeet or evening function."
      }
    },
    {
      "@type": "Question",
      name: "Affordable wedding outfits India?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "TatVivah provides a range of luxury wedding outfits that balance authentic craftsmanship with accessible pricing. Explore our collections for both grand sherwanis and affordable yet elegant Indo-Western fusion wear."
      }
    }
  ]
};

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function fetchHomeData<T>(path: string): Promise<T | null> {
  if (!API_URL) return null;

  try {
    const response = await fetch(`${API_URL}${path}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export default async function Home() {
  const [categories, bestsellers, products] = await Promise.all([
    fetchHomeData<CategoryListResponse>("/v1/categories"),
    fetchHomeData<{ products: BestsellerProduct[] }>("/v1/bestsellers?limit=4"),
    fetchHomeData<{ data: (MarketplaceCardProduct & { createdAt?: string })[] }>("/v1/products?limit=20"),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <HomeClient
        initialData={{
          categories: categories?.categories ?? undefined,
          bestsellers: bestsellers ?? undefined,
          products: products ?? undefined,
        }}
      />
    </>
  );
}
