import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchAutocomplete } from "@/components/search-autocomplete";
import { SortDropdown } from "@/components/sort-dropdown";
import { MarketplaceProductCard } from "@/components/marketplace-product-card";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const SITE_URL = "https://tatvivahtrends.com";

type SearchParams = {
  page?: string;
  categoryId?: string;
  category?: string;
  occasion?: string;
  search?: string;
  sort?: string;
};

type CategoryItem = {
  id: string;
  name: string;
  slug?: string;
};

type OccasionItem = {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  isActive: boolean;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function fetchCategories() {
  if (!API_BASE_URL) {
    return [] as CategoryItem[];
  }
  const response = await fetch(`${API_BASE_URL}/v1/categories`, {
    next: { revalidate: 120 },
  });
  if (!response.ok) {
    return [] as CategoryItem[];
  }
  const data = await response.json();
  return (data?.categories ?? []) as CategoryItem[];
}

async function fetchOccasions() {
  if (!API_BASE_URL) {
    return [] as OccasionItem[];
  }
  const response = await fetch(`${API_BASE_URL}/v1/occasions`, {
    next: { revalidate: 120 },
  });
  if (!response.ok) {
    return [] as OccasionItem[];
  }
  const data = await response.json();
  return (data?.occasions ?? []) as OccasionItem[];
}

async function fetchProducts(params: {
  page: number;
  limit: number;
  categoryId?: string;
  occasion?: string;
  search?: string;
  sort?: string;
}) {
  if (!API_BASE_URL) {
    return { data: [], pagination: { page: 1, limit: params.limit, total: 0, totalPages: 1 } };
  }
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("limit", String(params.limit));
  if (params.categoryId) query.set("categoryId", params.categoryId);
  if (params.occasion) query.set("occasion", params.occasion);
  if (params.search) query.set("search", params.search);
  if (params.sort) query.set("sort", params.sort);

  const response = await fetch(`${API_BASE_URL}/v1/products?${query.toString()}`, {
    next: { revalidate: 60 },
  });
  if (!response.ok) {
    return { data: [], pagination: { page: params.page, limit: params.limit, total: 0, totalPages: 1 } };
  }
  return response.json();
}

/* ── Dynamic SEO metadata ── */
export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}): Promise<Metadata> {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const categorySlug = resolvedParams?.category?.trim().toLowerCase();
  const occasionSlug = resolvedParams?.occasion?.trim();

  let title = "Shop Ethnic Wear for Men Online | Sherwani, Kurta & Indo Western";
  let description =
    "Browse premium ethnic wear for men including sherwani, kurta sets, Indo-Western outfits, and wedding collections. Find the perfect outfit for mehendi, sangeet, reception, and festive occasions.";

  if (occasionSlug) {
    const label = occasionSlug.charAt(0).toUpperCase() + occasionSlug.slice(1).replace(/-/g, " ");
    title = `${label} Outfits for Men | Wedding ${label} Kurta`;
    description = `Shop premium ${label.toLowerCase()} outfits for men online. Discover stylish ethnic wear, exclusively curated sherwani and kurta sets perfect for ${label.toLowerCase()} ceremonies and festive events.`;
  } else if (categorySlug) {
    const label = categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1).replace(/-/g, " ");
    title = `${label} for Men | Wedding ${label} Online`;
    description = `Shop premium ${label.toLowerCase()} for men online in India. Discover stylish traditional ${label.toLowerCase()}, modern wedding outfits, and festive ethnic wear.`;
  }

  const params = new URLSearchParams();
  if (categorySlug) params.set("category", categorySlug);
  if (occasionSlug) params.set("occasion", occasionSlug);
  const canonicalPath = params.toString()
    ? `/marketplace?${params.toString()}`
    : "/marketplace";

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}${canonicalPath}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${canonicalPath}`,
      siteName: "TatVivah",
      type: "website",
      images: [
        {
          url: "/og.png",
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"],
    },
  };
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const page = Number(resolvedParams?.page ?? "1") || 1;
  const categoryIdParam = resolvedParams?.categoryId?.trim();
  const categorySlugParam = resolvedParams?.category?.trim().toLowerCase();
  const occasionSlug = resolvedParams?.occasion?.trim();
  const search = resolvedParams?.search?.trim();
  const sort = resolvedParams?.sort?.trim();

  const [categories, occasions] = await Promise.all([
    fetchCategories(),
    fetchOccasions(),
  ]);

  const selectedCategoryById = categoryIdParam
    ? categories.find((category) => category.id === categoryIdParam)
    : undefined;
  const selectedCategoryBySlug = categorySlugParam
    ? categories.find(
      (category) =>
        (category.slug ?? slugify(category.name)) === categorySlugParam
    )
    : undefined;

  const selectedCategoryId =
    selectedCategoryById?.id ?? selectedCategoryBySlug?.id;

  const productsResponse = await fetchProducts({
    page,
    limit: 9,
    categoryId: selectedCategoryId,
    occasion: occasionSlug,
    search,
    sort,
  });

  const products = productsResponse?.data ?? [];
  const pagination = productsResponse?.pagination ?? {
    page,
    limit: 9,
    total: 0,
    totalPages: 1,
  };

  const activeOccasions = occasions.filter((occasion) => occasion.isActive);
  const selectedOccasion = activeOccasions.find(
    (occasion) => occasion.slug === occasionSlug
  );

  const selectedCategory =
    categories.find((category) => category.id === selectedCategoryId) ?? null;

  const getCategorySlug = (category: CategoryItem) =>
    category.slug ?? slugify(category.name);

  // null → clear param, undefined → keep current value, string → set
  const buildUrl = (options: {
    nextPage?: number;
    nextOccasion?: string | null;
    nextCategoryId?: string | null;
    nextSearch?: string | null;
    nextSort?: string | null;
  }) => {
    const params = new URLSearchParams();

    const occ = options.nextOccasion === null ? undefined : (options.nextOccasion ?? occasionSlug);
    if (occ) params.set("occasion", occ);

    const catId = options.nextCategoryId === null ? undefined : (options.nextCategoryId ?? selectedCategoryId);
    if (catId) {
      const cat = categories.find((item) => item.id === catId);
      if (cat) params.set("category", getCategorySlug(cat));
      else params.set("categoryId", catId);
    }

    const s = options.nextSearch === null ? undefined : (options.nextSearch ?? search);
    if (s) params.set("search", s);

    const so = options.nextSort === null ? undefined : (options.nextSort ?? sort);
    if (so) params.set("sort", so);

    const p = options.nextPage ?? page;
    if (p > 1) params.set("page", String(p));

    return `/marketplace?${params.toString()}`;
  };

  /* ── ItemList JSON-LD for product listings ── */
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: selectedOccasion?.name
      ? `${selectedOccasion.name} Collection`
      : selectedCategory
        ? `${selectedCategory.name} Collection`
        : "All Ethnic Wear Collections",
    numberOfItems: products.length,
    itemListElement: products.map((product: any, index: number) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE_URL}/product/${product.id}`,
      name: product.title,
    })),
  };

  /* ── Breadcrumb JSON-LD ── */
  const breadcrumbItems = [
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
  ];

  if (selectedCategory) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: selectedCategory.name,
      item: `${SITE_URL}/marketplace?category=${getCategorySlug(selectedCategory)}`,
    });
  } else if (selectedOccasion) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: selectedOccasion.name,
      item: `${SITE_URL}/marketplace?occasion=${selectedOccasion.slug}`,
    });
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };

  return (
    <div className="min-h-[calc(100vh-160px)] bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <section className="border-b border-border-soft bg-background">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex gap-4 overflow-x-auto pb-1">
            <Link
              href={buildUrl({ nextPage: 1, nextOccasion: null })}
              className="group shrink-0 text-center"
            >
              <div className={`mx-auto h-20 w-20 overflow-hidden rounded-full border-2 transition-colors ${!occasionSlug
                ? "border-gold"
                : "border-border-soft group-hover:border-gold/60"
                }`}>
                <div className="flex h-full w-full items-center justify-center bg-cream text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  All
                </div>
              </div>
              <p className="mt-2 text-xs font-medium text-foreground">All</p>
            </Link>

            {activeOccasions.map((occasion) => {
              const selected = occasion.slug === occasionSlug;
              return (
                <Link
                  key={occasion.id}
                  href={buildUrl({ nextPage: 1, nextOccasion: occasion.slug })}
                  className="group shrink-0 text-center"
                >
                  <div className={`mx-auto h-20 w-20 overflow-hidden rounded-full border-2 transition-colors ${selected
                    ? "border-gold"
                    : "border-border-soft group-hover:border-gold/60"
                    }`}>
                    {occasion.image ? (
                      <img
                        src={occasion.image}
                        alt={occasion.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-cream text-lg font-serif text-muted-foreground">
                        {occasion.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <p className={`mt-2 text-xs font-medium ${selected ? "text-foreground" : "text-muted-foreground"}`}>
                    {occasion.name}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-20">
        <section className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold">
            Occasion Collections
          </p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-4xl font-light tracking-tight text-foreground sm:text-5xl">
                {selectedOccasion?.name ?? "All Occasions"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {pagination.total} Results
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4 border border-border-soft bg-card p-4 md:flex-row md:items-center md:justify-between">
          <div className="w-full md:max-w-md">
            <SearchAutocomplete
              defaultValue={search ?? ""}
              placeholder="Search collections, styles..."
            />
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="#marketplace-categories">Filter</Link>
            </Button>
            <SortDropdown />
          </div>
        </section>

        <section id="marketplace-categories" className="flex flex-wrap gap-3">
          {categories.length === 0 ? (
            <span className="text-sm text-muted-foreground">
              Categories loading...
            </span>
          ) : (
            categories.map((category) => (
              <Link
                key={category.id}
                href={buildUrl({ nextPage: 1, nextCategoryId: category.id })}
                className={`px-5 py-2.5 text-xs uppercase tracking-wider transition-all duration-300 border ${selectedCategory?.id === category.id
                  ? "border-gold bg-cream text-charcoal dark:bg-brown/30 dark:text-ivory"
                  : "border-border-soft bg-card text-muted-foreground hover:border-gold/50 hover:text-foreground"
                  }`}
              >
                {category.name}
              </Link>
            ))
          )}
        </section>

        <section className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {pagination.total} {pagination.total === 1 ? "product" : "products"} found
          </p>
          {selectedCategory ? (
            <Button asChild variant="ghost" size="sm" className="text-xs uppercase tracking-wider">
              <Link
                href={buildUrl({ nextPage: 1, nextCategoryId: null })}
              >
                Clear Category
              </Link>
            </Button>
          ) : null}
        </section>

        {/* Products Grid */}
        <section className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {products.length === 0 ? (
            <Card className="sm:col-span-2 lg:col-span-3 border-border-soft">
              <CardContent className="p-8 text-center text-muted-foreground">
                No products found. Try adjusting your search or filters.
              </CardContent>
            </Card>
          ) : (
            products.map((product: any) => (
              <MarketplaceProductCard key={product.id} product={product} />
            ))
          )}
        </section>

        {/* Pagination */}
        <section className="flex items-center justify-between border-t border-border-soft pt-8">
          <Button
            asChild
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
          >
            <Link
              href={buildUrl({ nextPage: Math.max(pagination.page - 1, 1) })}
            >
              ← Previous
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <Button
            asChild
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
          >
            <Link
              href={buildUrl({ nextPage: Math.min(pagination.page + 1, pagination.totalPages) })}
            >
              Next →
            </Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
