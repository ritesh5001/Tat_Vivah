import type { Metadata } from "next";
import HomeClient from "@/components/home/HomeClient";

export const metadata: Metadata = {
  title:
    "Best Ethnic Wear for Men in India | Sherwani, Kurta & Wedding Outfits",
  description:
    "Discover the best ethnic wear for men in India at TatVivah. Shop premium sherwani, kurta sets, Indo-Western outfits and wedding collections perfect for mehendi, sangeet, reception and festive occasions.",
  alternates: {
    canonical: "https://tatvivah.com",
  },
  openGraph: {
    title: "Best Ethnic Wear for Men in India | Sherwani, Kurta & Wedding Outfits | TatVivah",
    description:
      "Discover the best ethnic wear for men in India at TatVivah. Shop premium sherwani, kurta sets, Indo-Western outfits and wedding collections.",
    url: "https://tatvivah.com",
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
  url: "https://tatvivah.com",
  logo: "https://tatvivah.com/logo.png",
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
      name: "What is the best ethnic wear for men in India?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The best ethnic wear for men in India includes Sherwanis, Kurta Sets, and Indo-Western outfits. TatVivah offers a premium collection designed for weddings and festive occasions."
      }
    },
    {
      "@type": "Question",
      name: "Where to buy sherwani online?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You can buy high-quality designer sherwanis online at TatVivah. We offer a wide range of colors, fabrics, and embroideries perfect for grooms and wedding guests."
      }
    },
    {
      "@type": "Question",
      name: "What to wear for mehendi?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "For mehendi ceremonies, lightweight and colorful Kurta Sets, printed Nehru jackets over kurtas, or contemporary asymmetrical Indo-Western outfits are highly recommended."
      }
    },
    {
      "@type": "Question",
      name: "What is Indo Western dress?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Indo Western for men is a fusion style combining traditional Indian elements with Western tailoring. Common styles include asymmetrical hemlines, draped kurtas, and Jodhpuri suits."
      }
    }
  ]
};

export default function Home() {
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
      <HomeClient />
    </>
  );
}
