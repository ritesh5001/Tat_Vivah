import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchAutocomplete } from "@/components/search-autocomplete";
import { SortDropdown } from "@/components/sort-dropdown";
import { MarketplaceProductCard } from "@/components/marketplace-product-card";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type SearchParams = {
  page?: string;
  categoryId?: string;
  search?: string;
  sort?: string;
};

async function fetchCategories() {
  if (!API_BASE_URL) {
    return [] as Array<{ id: string; name: string }>;
  }
  const response = await fetch(`${API_BASE_URL}/v1/categories`, {
    next: { revalidate: 120 },
  });
  if (!response.ok) {
    return [] as Array<{ id: string; name: string }>;
  }
  const data = await response.json();
  return (data?.categories ?? []) as Array<{ id: string; name: string }>;
}

async function fetchProducts(params: {
  page: number;
  limit: number;
  categoryId?: string;
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

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const page = Number(resolvedParams?.page ?? "1") || 1;
  const categoryId = resolvedParams?.categoryId;
  const search = resolvedParams?.search?.trim();
  const sort = resolvedParams?.sort?.trim();

  const [categories, productsResponse] = await Promise.all([
    fetchCategories(),
    fetchProducts({ page, limit: 9, categoryId, search, sort }),
  ]);

  const products = productsResponse?.data ?? [];
  const pagination = productsResponse?.pagination ?? {
    page,
    limit: 9,
    total: 0,
    totalPages: 1,
  };

  const buildUrl = (nextPage: number, nextCategoryId?: string) => {
    const params = new URLSearchParams();
    params.set("page", String(nextPage));
    const categoryParam = typeof nextCategoryId === "string" ? nextCategoryId : categoryId;
    if (categoryParam) params.set("categoryId", categoryParam);
    if (search) params.set("search", search);
    if (sort) params.set("sort", sort);
    return `/marketplace?${params.toString()}`;
  };

  return (
    <div className="min-h-[calc(100vh-160px)] bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-20">
        {/* Hero Section */}
        <section className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4 max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold">
              TatVivah Marketplace
            </p>
            <h1 className="font-serif text-4xl font-light tracking-tight text-foreground sm:text-5xl">
              Discover Premium
              <br />
              <span className="italic">Curated</span> Collections
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground">
              Verified sellers, authentic craftsmanship, and trusted checkout.
              Every piece tells a story of heritage.
            </p>
          </div>

          {/* Search Form with Autocomplete */}
          <div className="flex w-full max-w-sm flex-col gap-4 border border-border-soft bg-card p-6">
            <SearchAutocomplete
              defaultValue={search ?? ""}
              placeholder="Search collections, styles..."
            />
          </div>
        </section>

        {/* Category Filters */}
        <section className="flex flex-wrap gap-3">
          {categories.length === 0 ? (
            <span className="text-sm text-muted-foreground">
              Categories loading...
            </span>
          ) : (
            categories.map((category) => (
              <Link
                key={category.id}
                href={buildUrl(1, category.id)}
                className={`px-5 py-2.5 text-xs uppercase tracking-wider transition-all duration-300 border ${categoryId === category.id
                  ? "border-gold bg-cream text-charcoal dark:bg-brown/30 dark:text-ivory"
                  : "border-border-soft bg-card text-muted-foreground hover:border-gold/50 hover:text-foreground"
                  }`}
              >
                {category.name}
              </Link>
            ))
          )}
        </section>

        {/* Sort Controls */}
        <section className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {pagination.total} {pagination.total === 1 ? "product" : "products"} found
          </p>
          <SortDropdown />
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
            <Link href={buildUrl(Math.max(pagination.page - 1, 1))}>
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
            <Link href={buildUrl(Math.min(pagination.page + 1, pagination.totalPages))}>
              Next →
            </Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
