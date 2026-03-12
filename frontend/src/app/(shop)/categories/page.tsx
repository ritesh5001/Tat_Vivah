import type { Metadata } from "next";
import Link from "next/link";
import { getCategories, type Category } from "@/services/catalog";
import { MotionCard } from "@/components/motion/MotionCard";

// Using the same resolver as CategoryCarousel so they look identical
type CategoryItem = Category & {
    image?: string | null;
    imageUrl?: string | null;
};

function resolveCategoryImage(category: CategoryItem): string {
    const raw = category.imageUrl ?? category.image ?? "";
    if (!raw) return "/images/product-placeholder.svg";
    if (raw.startsWith("/")) return raw;
    if (raw.startsWith("https://ik.imagekit.io")) return raw;
    return "/images/product-placeholder.svg";
}

export const metadata: Metadata = {
    title: "All Categories | Ethnic Wear Collections for Men",
    description:
        "Browse curated ethnic wear categories for men. Shop sherwani, kurta sets, Indo-Western outfits, wedding wear and festive collections from top designers in India.",
    alternates: {
        canonical: "https://tatvivah.com/categories",
    },
    openGraph: {
        title: "All Categories | Ethnic Wear Collections for Men | TatVivah",
        description:
            "Browse curated ethnic wear categories for men. Shop sherwani, kurta sets, Indo-Western outfits, wedding wear and festive collections.",
        url: "https://tatvivah.com/categories",
        siteName: "TatVivah",
        type: "website",
    },
};

export default async function CategoriesPage() {
    let categories: CategoryItem[] = [];
    try {
        const response = await getCategories();
        categories = (response.categories ?? []).filter((c) => c.isActive);
    } catch (err) {
        console.error("Failed to load categories", err);
    }

    return (
        <div className="min-h-[calc(100vh-160px)] bg-cream border-t border-border-soft">
            <div className="mx-auto max-w-6xl px-6 py-20">
                <div className="mb-12 text-center md:mb-16">
                    <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-gold">
                        Explore All
                    </p>
                    <h1 className="font-serif text-4xl font-light tracking-tight text-foreground sm:text-5xl">
                        Curated Collections
                    </h1>
                </div>

                {categories.length === 0 ? (
                    <div className="rounded-none border border-border-soft bg-card px-6 py-16 text-center text-sm text-muted-foreground max-w-lg mx-auto">
                        No active categories found right now. Check back soon.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 md:gap-6 lg:gap-8">
                        {categories.map((category) => (
                            <Link key={category.id} href={`/marketplace?categoryId=${category.id}`} className="group contents">
                                <MotionCard
                                    imageSrc={resolveCategoryImage(category)}
                                    imageAlt={category.name}
                                    aspectClass="aspect-square"
                                    widthClass="w-full"
                                >
                                    <div className="px-3 py-5 text-center">
                                        <h3 className="line-clamp-2 font-serif text-lg font-normal tracking-tight text-foreground transition-colors duration-300 group-hover:text-gold">
                                            {category.name}
                                        </h3>
                                    </div>
                                </MotionCard>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
