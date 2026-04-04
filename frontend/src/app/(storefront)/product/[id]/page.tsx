import type { Metadata } from "next";
import Link from "next/link";
import ProductDetailClient from "@/components/product-detail-client";
import { ProductDetailDeferredSections } from "@/components/product-detail-deferred-sections";
import ProductImageCarousel from "@/components/product-image-carousel";
import { SITE_URL } from "@/lib/site-config";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function fetchProduct(id: string) {
  if (!API_BASE_URL) {
    return null;
  }
  const response = await fetch(`${API_BASE_URL}/v1/products/${id}`, {
    next: { revalidate: 60 },
  });
  if (!response.ok) {
    return null;
  }
  return response.json();
}

/* ── Dynamic SEO metadata ── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await fetchProduct(resolvedParams.id);
  const product = data?.product;

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The product you are looking for is not available.",
    };
  }

  const title = `${product.title} | Buy Ethnic Wear Online`;
  const description = `Buy ${product.title} online in India. Premium ethnic wear for men perfect for weddings, receptions, mehendi and festive occasions.`;
  const image = product.images?.[0] ?? "/og.png";

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/product/${resolvedParams.id}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/product/${resolvedParams.id}`,
      siteName: "TatVivah",
      type: "website",
      images: [
        {
          url: image,
          alt: product.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const data = await fetchProduct(resolvedParams.id);
  const product = data?.product;
  const images = product?.images?.length
    ? product.images
    : ["/images/product-placeholder.svg"];

  /* ── Product JSON-LD structured data ── */
  const productJsonLd = product
    ? {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      image: product.images?.[0] ?? `${SITE_URL}/og.png`,
      description:
        product.description ??
        `Buy ${product.title} online in India. Premium ethnic wear for men.`,
      brand: {
        "@type": "Brand",
        name: product.seller?.shopName ?? "TatVivah",
      },
      offers: {
        "@type": "Offer",
        price: product.salePrice ?? product.adminPrice ?? product.price ?? 0,
        priceCurrency: "INR",
        availability: "https://schema.org/InStock",
        url: `${SITE_URL}/product/${resolvedParams.id}`,
      },
    }
    : null;

  /* ── Breadcrumb JSON-LD ── */
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Marketplace",
        item: `${SITE_URL}/marketplace`,
      },
      ...(product ? [{
        "@type": "ListItem",
        position: 3,
        name: product.title,
        item: `${SITE_URL}/product/${resolvedParams.id}`,
      }] : [])
    ],
  };

  return (
    <div className="min-h-[calc(100vh-160px)] bg-background">
      {/* Breadcrumb JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Product JSON-LD */}
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}

      <div className="mx-auto flex max-w-7xl flex-col gap-20 px-6 py-16 lg:py-20">
        {/* Main Product Section */}
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <ProductImageCarousel images={images} title={product?.title} />
          {product ? (
            <ProductDetailClient product={product} />
          ) : (
            <div className="flex flex-col justify-center space-y-6 py-12">
              <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gold">
                Product Unavailable
              </p>
              <h1 className="font-serif text-3xl font-light text-foreground">
                We couldn't load this product.
              </h1>
              <p className="text-sm text-muted-foreground">
                Please return to the marketplace and try another listing.
              </p>
            </div>
          )}
        </section>
        <ProductDetailDeferredSections productId={resolvedParams.id} />

        {/* Collections & Occasions Links */}
        <section className="border-t border-border-soft pt-12 pb-4">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">Explore More</p>
            <div className="flex flex-wrap justify-center gap-4">
              {product?.categoryId && (
                <Link href={`/collections/${product.categoryId}`} className="text-sm font-medium text-muted-foreground hover:text-foreground underline underline-offset-4">
                  Shop more {product.categoryName || 'in this Category'}
                </Link>
              )}
              <Link href="/collections/kurta" className="text-sm font-medium text-muted-foreground hover:text-foreground underline underline-offset-4">Kurtas</Link>
              <Link href="/collections/sherwani" className="text-sm font-medium text-muted-foreground hover:text-foreground underline underline-offset-4">Sherwanis</Link>
              <Link href="/occasion/wedding" className="text-sm font-medium text-muted-foreground hover:text-foreground underline underline-offset-4">Wedding Outfits</Link>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="border-t border-border-soft pt-12">
          <div className="flex flex-wrap items-center justify-center gap-8 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-gold" />
              Verified Artisans
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-gold" />
              Secure Checkout
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-gold" />
              Easy Returns
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-gold" />
              Pan-India Delivery
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
