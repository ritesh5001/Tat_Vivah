import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const SITE_URL = "https://tatvivahtrends.com";

// Mock static data for the blog concept
export const BLOG_POSTS = [
    {
        slug: "trending-wedding-outfits-for-men-2026",
        title: "Trending Wedding Outfits for Men in 2026",
        description: "Discover the most sought-after wedding outfits for Indian grooms this wedding season, from pastel sherwanis to asymmetrical Indo-Westerns.",
        date: "2026-03-12",
        author: "TatVivah Editorial",
        image: "/images/blog/wedding-trends.jpg",
        content: `
      <p>The modern groom is no longer confined to traditional red and gold. In 2026, wedding fashion for men is experiencing a renaissance of pastels, asymmetrical cuts, and sustainable textiles.</p>
      <h2>The Rise of Pastels</h2>
      <p>Ivory, mint green, and blush pink have taken center stage. Men are pairing intricate floral embroidery with these softer hues for daytime ceremonies.</p>
      <h2>Indo-Western Dominance</h2>
      <p>For receptions and sangeet nights, the traditional Sherwani is making way for the Indo-Western jacket. Draped kurtas layered beneath structured bandhgalas create a majestic silhouette.</p>
    `,
    },
    {
        slug: "how-to-style-kurta-pajama-for-haldi",
        title: "How to Style a Kurta Pajama for Your Haldi",
        description: "The complete guide on choosing the perfect yellow kurta set for your Haldi ceremony without sacrificing comfort.",
        date: "2026-02-28",
        author: "TatVivah Editors",
        image: "/images/blog/haldi-kurta.jpg",
        content: `
      <p>The Haldi ceremony is an intimate, energetic, and unavoidably messy affair. Choosing the right outfit balances heritage style with practical comfort.</p>
      <h2>Fabric is Everything</h2>
      <p>Stick to lightweight Chanderi silk or pure cotton. These fabrics breathe well and resist trapping heat during outdoor morning functions.</p>
      <h2>Color Combinations</h2>
      <p>While mustard yellow is classic, experimenting with ochre, ivory, and soft peach can help you stand out. Pair it with an ivory churidar for a classic finish.</p>
    `,
    },
];

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = BLOG_POSTS.find((p) => p.slug === slug);

    if (!post) return {};

    const url = `${SITE_URL}/blog/${slug}`;

    // Extract keywords from title roughly
    const defaultKeywords = "ethnic wear blog, indian grooms, wedding fashion men";
    const dynamicKeywords = post.title.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(" ").filter(w => w.length > 3).join(", ");

    return {
        title: `${post.title} | TatVivah Journal`,
        description: post.description,
        keywords: `${defaultKeywords}, ${dynamicKeywords}`,
        alternates: { canonical: url },
        openGraph: {
            title: post.title,
            description: post.description,
            url,
            type: "article",
            publishedTime: post.date,
            authors: [post.author],
            images: [
                {
                    url: post.image || "/og.png",
                    alt: post.title,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: post.title,
            description: post.description,
            images: [post.image || "/og.png"],
        },
    };
}

export default async function BlogPostPage({ params }: Props) {
    const { slug } = await params;
    const post = BLOG_POSTS.find((p) => p.slug === slug);

    if (!post) {
        notFound();
    }

    /* ── Article JSON-LD ── */
    const articleJsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: post.description,
        image: `${SITE_URL}${post.image || '/og.png'}`,
        datePublished: new Date(post.date).toISOString(),
        author: {
            "@type": "Person",
            name: post.author,
        },
        publisher: {
            "@type": "Organization",
            name: "TatVivah",
            logo: {
                "@type": "ImageObject",
                url: `${SITE_URL}/logo.png`,
            },
        },
    };

    /* ── Breadcrumb JSON-LD ── */
    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Journal", item: `${SITE_URL}/blog` },
            { "@type": "ListItem", position: 3, name: post.title, item: `${SITE_URL}/blog/${slug}` },
        ],
    };

    return (
        <article className="bg-background min-h-screen pb-24">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

            {/* Blog Header */}
            <header className="border-b border-border-soft bg-cream/30 dark:bg-card/30 pt-32 pb-16 px-6">
                <div className="mx-auto max-w-3xl text-center">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold mb-6">
                        TatVivah Journal • {new Date(post.date).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </p>
                    <h1 className="font-serif text-4xl font-light tracking-tight text-foreground sm:text-5xl lg:text-6xl mb-6 leading-tight">
                        {post.title}
                    </h1>
                    <p className="text-sm uppercase tracking-wider text-muted-foreground">
                        By {post.author}
                    </p>
                </div>
            </header>

            {/* Blog Content */}
            <div className="mx-auto max-w-3xl px-6 py-16">
                <div
                    className="prose prose-stone dark:prose-invert max-w-none prose-headings:font-serif prose-headings:font-light prose-h2:text-3xl prose-h2:mt-12 prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:text-[17px] prose-a:text-gold hover:prose-a:text-gold/80 transition-colors"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />

                <div className="mt-16 pt-8 border-t border-border-soft flex items-center justify-between">
                    <Link
                        href="/blog"
                        className="text-xs font-medium uppercase tracking-[0.15em] text-charcoal dark:text-ivory hover:text-gold transition-colors"
                    >
                        ← Back to Journal
                    </Link>
                    <div className="flex gap-4">
                        <Link href="/collections/sherwani" className="text-xs tracking-wider text-muted-foreground hover:text-gold underline underline-offset-4">
                            Shop Sherwanis
                        </Link>
                        <Link href="/occasion/wedding" className="text-xs tracking-wider text-muted-foreground hover:text-gold underline underline-offset-4">
                            Wedding Edit
                        </Link>
                    </div>
                </div>
            </div>
        </article>
    );
}
