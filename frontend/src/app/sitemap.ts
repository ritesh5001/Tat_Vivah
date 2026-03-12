import type { MetadataRoute } from "next";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const SITE_URL = "https://tatvivah.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: SITE_URL,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1,
        },
        {
            url: `${SITE_URL}/marketplace`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.9,
        },
        {
            url: `${SITE_URL}/categories`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
        },
    ];

    /* ── Fetch all products ── */
    let productRoutes: MetadataRoute.Sitemap = [];
    try {
        if (API_BASE_URL) {
            const res = await fetch(`${API_BASE_URL}/v1/products?limit=1000`, {
                next: { revalidate: 3600 },
            });
            if (res.ok) {
                const data = await res.json();
                const products = data?.data ?? [];
                productRoutes = products.map((product: any) => ({
                    url: `${SITE_URL}/product/${product.id}`,
                    lastModified: product.updatedAt
                        ? new Date(product.updatedAt)
                        : new Date(),
                    changeFrequency: "weekly" as const,
                    priority: 0.7,
                }));
            }
        }
    } catch {
        /* silently skip if API is not available */
    }

    /* ── Fetch all categories ── */
    let categoryRoutes: MetadataRoute.Sitemap = [];
    try {
        if (API_BASE_URL) {
            const res = await fetch(`${API_BASE_URL}/v1/categories`, {
                next: { revalidate: 3600 },
            });
            if (res.ok) {
                const data = await res.json();
                const categories = data?.categories ?? [];
                categoryRoutes = categories
                    .filter((cat: any) => cat.isActive)
                    .map((cat: any) => {
                        const slug =
                            cat.slug ??
                            cat.name
                                .toLowerCase()
                                .trim()
                                .replace(/[^a-z0-9]+/g, "-")
                                .replace(/(^-|-$)/g, "");
                        return {
                            url: `${SITE_URL}/marketplace?category=${slug}`,
                            lastModified: new Date(),
                            changeFrequency: "weekly" as const,
                            priority: 0.8,
                        };
                    });
            }
        }
    } catch {
        /* silently skip */
    }

    /* ── Fetch all occasions ── */
    let occasionRoutes: MetadataRoute.Sitemap = [];
    try {
        if (API_BASE_URL) {
            const res = await fetch(`${API_BASE_URL}/v1/occasions`, {
                next: { revalidate: 3600 },
            });
            if (res.ok) {
                const data = await res.json();
                const occasions = data?.occasions ?? [];
                occasionRoutes = occasions
                    .filter((occ: any) => occ.isActive)
                    .map((occ: any) => ({
                        url: `${SITE_URL}/marketplace?occasion=${occ.slug}`,
                        lastModified: new Date(),
                        changeFrequency: "weekly" as const,
                        priority: 0.8,
                    }));
            }
        }
    } catch {
        /* silently skip */
    }

    return [
        ...staticRoutes,
        ...productRoutes,
        ...categoryRoutes,
        ...occasionRoutes,
    ];
}
