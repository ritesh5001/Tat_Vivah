import { Card, CardContent } from "@/components/ui/card";
import ProductDetailClient from "@/components/product-detail-client";
import ProductImageCarousel from "@/components/product-image-carousel";
import ProductReviews from "@/components/product-reviews";
import { RelatedProducts } from "@/components/related-products";
import { RecentlyViewedTracker } from "@/components/recently-viewed-tracker";

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

  return (
    <div className="min-h-[calc(100vh-160px)] bg-background">
      {/* Track recently viewed (fire-and-forget, client component) */}
      <RecentlyViewedTracker productId={resolvedParams.id} />

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



        {/* Reviews Section */}
        <section className="border-t border-border-soft pt-16">
          <ProductReviews productId={resolvedParams.id} />
        </section>

        {/* Related Products */}
        <RelatedProducts productId={resolvedParams.id} />

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
