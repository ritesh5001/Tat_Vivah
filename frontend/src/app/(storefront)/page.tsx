import type { Metadata } from "next";
import { Lock, RotateCcw, ShieldCheck } from "lucide-react";
import { CategoryCarousel } from "@/components/home/CategoryCarousel";
import { OccasionSection } from "@/components/home/OccasionSection";
import { ProductShowcaseSection } from "@/components/home/ProductShowcaseSection";
import { HeroStaticServer } from "@/components/home/HeroStaticServer";
import { BestsellersStrip } from "@/components/home/BestsellersStrip";
import { WeddingSectionBanner } from "@/components/home/WeddingSectionBanner";
import { InfiniteProductShowcaseSection } from "@/components/home/InfiniteProductShowcaseSection";
import { NewArrivalsSection } from "@/components/home/NewArrivalsSection";
import { FeaturesMarquee } from "@/components/features-marquee";
import { SectionReveal } from "@/components/motion/SectionReveal";
import type { MarketplaceCardProduct } from "@/components/marketplace-product-card";
import type { CategoryListResponse } from "@/services/catalog";
import type { BestsellerProduct } from "@/services/bestsellers";
import type { Occasion } from "@/services/occasions";
import { SITE_URL } from "@/lib/site-config";
import { CACHE_TAGS } from "@/lib/cache-tags";

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
    canonical: SITE_URL,
  },
  openGraph: {
    title: "Best Ethnic Wear for Men in India | Sherwani, Kurta & Wedding Outfits | TatVivah",
    description:
      "Discover the best ethnic wear for men in India at TatVivah. Shop premium sherwani, kurta sets, Indo-Western outfits and wedding collections.",
    url: SITE_URL,
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
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
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
const HOME_REVALIDATE_SECONDS = 300;

async function fetchHomeData<T>(path: string, tags: string[]): Promise<T | null> {
  if (!API_URL) return null;

  try {
    const response = await fetch(`${API_URL}${path}`, {
      next: { revalidate: HOME_REVALIDATE_SECONDS, tags },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function pickNewArrivals(products?: (MarketplaceCardProduct & { createdAt?: string })[]): MarketplaceCardProduct[] {
  if (!products?.length) return [];

  return products
    .slice()
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 2);
}

function TrustSection() {
  const trustItems = [
    {
      title: "Verified Artisans",
      titleShort: "Verified",
      desc: "Every seller is personally vetted",
      descShort: "Seller vetted",
      Icon: ShieldCheck,
    },
    {
      title: "Secure Payments",
      titleShort: "Payments",
      desc: "Protected by Razorpay",
      descShort: "Razorpay",
      Icon: Lock,
    },
    {
      title: "Hassle-Free Returns",
      titleShort: "Returns",
      desc: "10-day easy returns",
      descShort: "10-day",
      Icon: RotateCcw,
    },
  ];

  return (
    <section className="border-t border-border-soft bg-cream/50 dark:bg-card/50">
      <div className="mx-auto max-w-6xl px-6 py-4 sm:py-6">
        <div className="grid grid-cols-3 gap-3 text-center sm:gap-6">
          {trustItems.map((item) => (
            <div key={item.title} className="px-1">
              <div className="mb-1.5 flex justify-center text-gold">
                <item.Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.8} />
              </div>
              <h4 className="mb-0.5 text-[11px] font-medium leading-tight text-foreground sm:text-sm">
                <span className="sm:hidden">{item.titleShort}</span>
                <span className="hidden sm:inline">{item.title}</span>
              </h4>
              <p className="text-[10px] leading-tight text-muted-foreground sm:text-xs">
                <span className="sm:hidden">{item.descShort}</span>
                <span className="hidden sm:inline">{item.desc}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function Home() {
  const [
    categories,
    bestsellers,
    kidsBestsellers,
    products,
    kidsProducts,
    occasions,
  ] = await Promise.all([
    fetchHomeData<CategoryListResponse>("/v1/categories", [CACHE_TAGS.categories]),
    fetchHomeData<{ products: BestsellerProduct[] }>("/v1/bestsellers?limit=4&audience=MENS", [CACHE_TAGS.products]),
    fetchHomeData<{ products: BestsellerProduct[] }>("/v1/bestsellers?limit=4&audience=KIDS", [CACHE_TAGS.products]),
    fetchHomeData<{ data: (MarketplaceCardProduct & { createdAt?: string })[] }>("/v1/products?limit=10&audience=MENS", [CACHE_TAGS.products]),
    fetchHomeData<{ data: (MarketplaceCardProduct & { createdAt?: string })[] }>("/v1/products?limit=10&audience=KIDS", [CACHE_TAGS.products]),
    fetchHomeData<{ occasions: Occasion[] }>("/v1/occasions", [CACHE_TAGS.occasions]),
  ]);

  const bestsellersProducts = bestsellers?.products ?? [];
  const kidsBestsellersProducts = kidsBestsellers?.products ?? [];
  const newArrivals = pickNewArrivals(products?.data);
  const kidsNewArrivals = pickNewArrivals(kidsProducts?.data);

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

      <div className="min-h-[calc(100vh-160px)] bg-background">
        <OccasionSection initialOccasions={occasions?.occasions} />
        <HeroStaticServer />
        <SectionReveal>
          <CategoryCarousel initialCategories={categories?.categories} />
        </SectionReveal>
        <SectionReveal delayMs={40}>
          <BestsellersStrip
            bestsellers={bestsellersProducts}
            kidsBestsellers={kidsBestsellersProducts}
          />
        </SectionReveal>
        <SectionReveal delayMs={60}>
          <ProductShowcaseSection
            initialProducts={products?.data}
            kidsProducts={kidsProducts?.data}
          />
        </SectionReveal>

        <SectionReveal>
          <WeddingSectionBanner />
        </SectionReveal>

        <SectionReveal delayMs={40}>
          <NewArrivalsSection
            mensProducts={newArrivals}
            kidsProducts={kidsNewArrivals}
          />
        </SectionReveal>
        <SectionReveal>
          <FeaturesMarquee />
        </SectionReveal>
        <SectionReveal delayMs={20}>
          <InfiniteProductShowcaseSection
            initialProducts={products?.data}
            kidsProducts={kidsProducts?.data}
          />
        </SectionReveal>
        <SectionReveal delayMs={60}>
          <TrustSection />
        </SectionReveal>
      </div>
    </>
  );
}
