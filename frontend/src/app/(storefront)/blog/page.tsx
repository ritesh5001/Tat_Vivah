import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS } from "./posts";
import { SITE_URL } from "@/lib/site-config";

export const metadata: Metadata = {
    title: "The TatVivah Journal | Traditional Menswear & Wedding Style Blog",
    description: "Read the latest tips, trends, and style guides for men's ethnic wear. From styling a Sherwani to choosing the perfect Kurta for your Mehendi.",
    alternates: { canonical: `${SITE_URL}/blog` },
    keywords: "mens ethnic wear blog, sherwani styling tips, groom wedding outfits, traditional menswear india, fashion guide men",
    openGraph: {
        title: "The TatVivah Journal | Traditional Menswear & Wedding Style Blog",
        description: "Read the latest tips, trends, and style guides for men's ethnic wear.",
        url: `${SITE_URL}/blog`,
        type: "website",
        images: ["/og.png"],
    },
};

export default function BlogIndexPage() {
    return (
        <div className="bg-background min-h-screen">
            {/* Header */}
            <section className="border-b border-border-soft bg-cream/30 dark:bg-card/30">
                <div className="mx-auto max-w-6xl px-6 py-24 text-center">
                    <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold mb-4">
                        Editorial
                    </p>
                    <h1 className="font-serif text-4xl font-light tracking-tight text-foreground sm:text-5xl lg:text-7xl">
                        The Journal
                    </h1>
                    <p className="mt-6 text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Stories, style guides, and inspiration for the modern Indian man.
                        Navigate your wedding trousseau and festive wardrobe with expertise.
                    </p>
                </div>
            </section>

            {/* Blog Grid */}
            <section className="mx-auto max-w-6xl px-6 py-20">
                <div className="grid gap-12 md:grid-cols-2">
                    {BLOG_POSTS.map((post) => (
                        <article key={post.slug} className="group cursor-pointer">
                            <Link href={`/blog/${post.slug}`} className="block">
                                <div className="aspect-[16/10] bg-muted/20 overflow-hidden mb-6 border border-border-soft">
                                    <div className="w-full h-full bg-cream dark:bg-brown/20 flex items-center justify-center text-muted-foreground/50 transition-transform duration-700 group-hover:scale-105">
                                        {/* Placeholder for blog image */}
                                        <span className="font-serif italic text-xl">Image: {post.slug}</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-xs font-medium uppercase tracking-[0.15em] text-gold">
                                        {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                    </p>
                                    <h2 className="font-serif text-2xl font-light tracking-tight text-foreground group-hover:text-gold transition-colors">
                                        {post.title}
                                    </h2>
                                    <p className="text-muted-foreground leading-relaxed line-clamp-3">
                                        {post.description}
                                    </p>
                                    <span className="inline-flex items-center gap-2 border-b border-transparent pb-1 text-xs font-medium uppercase tracking-[0.15em] text-foreground transition-all duration-300 group-hover:border-gold group-hover:text-gold">
                                        Read Story <span className="text-gold">→</span>
                                    </span>
                                </div>
                            </Link>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}
