"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface ProductImageCarouselProps {
  images: string[];
  title?: string | null;
}

export default function ProductImageCarousel({
  images,
  title,
}: ProductImageCarouselProps) {
  const safeImages = useMemo(
    () => (images.length ? images : ["/images/product-placeholder.svg"]),
    [images]
  );
  const [activeIndex, setActiveIndex] = useState(0);

  const goTo = useCallback(
    (index: number) => {
      const maxIndex = safeImages.length - 1;
      if (index < 0) {
        setActiveIndex(maxIndex);
        return;
      }
      if (index > maxIndex) {
        setActiveIndex(0);
        return;
      }
      setActiveIndex(index);
    },
    [safeImages.length]
  );

  const visibleThumbs = safeImages.slice(0, 4);
  const remainingCount = Math.max(safeImages.length - 4, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col gap-6"
    >
      {/* Main Image - Gallery Frame Treatment */}
      <div className="relative bg-cream dark:bg-card p-6 sm:p-10 lg:p-12">
        {/* Subtle inner frame */}
        <div className="relative border border-border-soft bg-card overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="aspect-[4/5] w-full relative bg-card"
            >
              <Image
                src={safeImages[activeIndex]}
                alt={title ?? "Product image"}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain p-8 sm:p-12"
                quality={80}
                priority={activeIndex === 0}
              />
            </motion.div>
          </AnimatePresence>

          {/* Navigation - Minimal */}
          {safeImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => goTo(activeIndex - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center border border-border-soft bg-card/90 text-muted-foreground transition-all duration-300 hover:bg-card hover:text-foreground"
                aria-label="Previous image"
              >
                <span className="text-sm">←</span>
              </button>
              <button
                type="button"
                onClick={() => goTo(activeIndex + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center border border-border-soft bg-card/90 text-muted-foreground transition-all duration-300 hover:bg-card hover:text-foreground"
                aria-label="Next image"
              >
                <span className="text-sm">→</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Thumbnail Strip - Smaller, Minimal */}
      {safeImages.length > 1 && (
        <div className="flex items-center gap-3 px-6 sm:px-10 lg:px-12">
          {visibleThumbs.map((image, index) => {
            const isActive = index === activeIndex;
            const isLastThumb = index === visibleThumbs.length - 1;
            const showMore = remainingCount > 0 && isLastThumb;
            return (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => goTo(index)}
                className={`group relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 overflow-hidden transition-all duration-300 ${isActive
                    ? "border-2 border-gold"
                    : "border border-border-soft hover:border-gold/50"
                  }`}
                aria-label={`View image ${index + 1}`}
              >
                <Image
                  src={image}
                  alt={title ?? "Product thumbnail"}
                  width={80}
                  height={80}
                  className="h-full w-full object-contain p-1 bg-card"
                  loading="lazy"
                  quality={60}
                />
                {showMore ? (
                  <div className="absolute inset-0 grid place-items-center bg-charcoal/70 text-xs font-medium text-ivory">
                    +{remainingCount}
                  </div>
                ) : null}
              </button>
            );
          })}

          {/* Image Counter */}
          <div className="ml-auto text-[11px] text-muted-foreground uppercase tracking-wider">
            {activeIndex + 1} / {safeImages.length}
          </div>
        </div>
      )}
    </motion.div>
  );
}
