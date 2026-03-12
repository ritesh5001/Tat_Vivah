"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { fadeInVariants, viewportSettings } from "@/lib/motion.config";
import { getOccasions, type Occasion } from "@/services/occasions";

export function OccasionSection() {
  const [occasions, setOccasions] = React.useState<Occasion[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await getOccasions();
        if (mounted) setOccasions(res.occasions ?? []);
      } catch {
        if (mounted) setOccasions([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (!loading && occasions.length === 0) return null;

  return (
    <section className="border-t border-border-soft">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:py-12 lg:py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportSettings}
          variants={fadeInVariants}
          className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold mb-4">
              Curated for Every Celebration
            </p>
            <h2 className="font-serif text-3xl font-light tracking-tight text-foreground sm:text-4xl">
              Shop by Occasion
            </h2>
          </div>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground transition-colors duration-300 hover:text-foreground border-b border-transparent hover:border-gold pb-1"
          >
            Browse All
          </Link>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                <div className="aspect-3/4 bg-muted/30 rounded-sm" />
                <div className="mt-3 h-4 w-2/3 rounded bg-muted/30" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {occasions.map((occasion, index) => (
              <motion.div
                key={occasion.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                <Link
                  href={`/marketplace?occasion=${occasion.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-3/4 overflow-hidden rounded-sm border border-border-soft bg-muted/10">
                    {occasion.image ? (
                      <img
                        src={occasion.image}
                        alt={occasion.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-cream/50 dark:bg-charcoal/30">
                        <span className="font-serif text-2xl font-light text-muted-foreground/40">
                          {occasion.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 via-black/20 to-transparent p-4">
                      <p className="text-sm font-medium text-white">{occasion.name}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
