import { headers } from "next/headers";
import type { MetadataRoute } from "next";

export default async function robots(): Promise<MetadataRoute.Robots> {
    const headersList = await headers();
    const host = headersList.get("host") || "";

    // Strictly block subdomains
    if (host.startsWith("admin.") || host.startsWith("seller.")) {
        return {
            rules: {
                userAgent: "*",
                disallow: "/",
            },
        };
    }

    // Standard rules for main domain
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/admin", "/seller", "/api"],
            },
        ],
        sitemap: "https://tatvivahtrends.com/sitemap.xml",
    };
}
