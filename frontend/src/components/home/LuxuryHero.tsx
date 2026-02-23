"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";
import "swiper/css/effect-fade";

/* =========================================================================
   SLIDE DATA
   ========================================================================= */

interface HeroSlide {
  id: number;
  heading: string;
  subtext: string;
  button: string;
  href: string;
  desktopImage: string;
  mobileImage: string;
  textPosition: "left" | "right";
}

const slides: HeroSlide[] = [
  {
    id: 1,
    heading: "Crafted for Regal Grooms",
    subtext: "Heritage silhouettes for majestic celebrations.",
    button: "Explore Groom Collection",
    href: "/marketplace",
    desktopImage: "/images/hero/1st desktop banner.png",
    mobileImage: "/images/hero/1st mobile banner.png",
    textPosition: "left",
  },
  {
    id: 2,
    heading: "Celebrate In Style",
    subtext: "Modern wedding fashion crafted with elegance.",
    button: "Shop Wedding Looks",
    href: "/marketplace",
    desktopImage: "/images/hero/2nd desktop banner.png",
    mobileImage: "/images/hero/2nd mobile banner.png",
    textPosition: "right",
  },
  {
    id: 3,
    heading: "For Every Celebration",
    subtext: "From haldi to reception, complete your story.",
    button: "Discover Collections",
    href: "/marketplace",
    desktopImage: "/images/hero/3rd desktop banner.png",
    mobileImage: "/images/hero/3rd mobile banner.png",
    textPosition: "left",
  },
  {
    id: 4,
    heading: "Luxury Meets Tradition",
    subtext: "Premium wedding fashion for modern India.",
    button: "Start Exploring",
    href: "/marketplace",
    desktopImage: "/images/hero/4th desktop banner.png",
    mobileImage: "/images/hero/4th mobile banner.png",
    textPosition: "right",
  },
];

/* =========================================================================
   ANIMATION VARIANTS
   ========================================================================= */

const headingVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: "easeOut" as const },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.4, ease: "easeIn" as const },
  },
};

const subtextVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: "easeOut" as const, delay: 0.2 },
  },
  exit: {
    opacity: 0,
    y: -15,
    transition: { duration: 0.3, ease: "easeIn" as const },
  },
};

const buttonVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const, delay: 0.4 },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.3, ease: "easeIn" as const },
  },
};

/* =========================================================================
   PAGINATION DOT
   ========================================================================= */

function PaginationDot({
  active,
  index,
  onClick,
}: {
  active: boolean;
  index: number;
  onClick: (i: number) => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Go to slide ${index + 1}`}
      onClick={() => onClick(index)}
      className="group relative flex items-center justify-center p-1.5"
    >
      <span
        className={`
          block rounded-full transition-all duration-500 ease-out
          ${
            active
              ? "h-3 w-3 bg-white shadow-[0_0_8px_rgba(255,255,255,0.35)]"
              : "h-2 w-2 bg-white/40 group-hover:bg-white/70"
          }
        `}
      />
    </button>
  );
}

/* =========================================================================
   HERO SLIDE CONTENT OVERLAY
   ========================================================================= */

function SlideContent({
  slide,
  isActive,
}: {
  slide: HeroSlide;
  isActive: boolean;
}) {
  const isRight = slide.textPosition === "right";

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key={slide.id}
          className="absolute inset-0 z-20 flex items-end justify-center px-6 pb-12 sm:pb-16 md:items-center md:pb-0 md:px-0 md:justify-start"
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-16">
            <div
              className={`max-w-xl text-center md:text-left ${isRight ? "md:ml-auto md:text-right" : ""}`}
            >
              <motion.h1
                variants={headingVariants}
                className="font-serif text-3xl font-light leading-[1.1] tracking-tight text-white drop-shadow-[0_16px_32px_rgba(0,0,0,0.75)] sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl"
              >
                {slide.heading}
              </motion.h1>

              <motion.p
                variants={subtextVariants}
                className={`mt-4 max-w-md text-sm leading-relaxed text-white/80 drop-shadow-[0_12px_28px_rgba(0,0,0,0.6)] sm:mt-5 sm:text-base md:text-lg ${isRight ? "md:ml-auto" : ""}`}
              >
                {slide.subtext}
              </motion.p>

              <motion.div
                variants={buttonVariants}
                className={`mt-7 sm:mt-9 ${isRight ? "md:flex md:justify-end" : ""}`}
              >
                <Link
                  href={slide.href}
                  className="inline-flex items-center justify-center rounded-sm border border-gold-light/50 bg-gold px-8 py-3 text-[11px] font-medium uppercase tracking-[0.22em] text-white shadow-[0_8px_24px_rgba(183,149,108,0.35)] backdrop-blur-[2px] transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-dark hover:shadow-[0_12px_28px_rgba(183,149,108,0.45)] sm:px-10 sm:py-3.5"
                >
                  {slide.button}
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* =========================================================================
   ZOOM BACKGROUND IMAGE
   ========================================================================= */

function SlideBackground({
  slide,
  isActive,
  priority,
}: {
  slide: HeroSlide;
  isActive: boolean;
  priority: boolean;
}) {
  const isRight = slide.textPosition === "right";

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Desktop Image */}
      <div
        className={`hidden md:block absolute inset-0 transition-transform duration-6000 ease-in-out ${isActive ? "scale-[1.04]" : "scale-100"}`}
      >
        <Image
          src={slide.desktopImage}
          alt={slide.heading}
          fill
          className="object-cover"
          sizes="100vw"
          priority={priority}
          loading={priority ? "eager" : "lazy"}
        />
      </div>

      {/* Mobile Image */}
      <div
        className={`block md:hidden absolute inset-0 transition-transform duration-6000 ease-in-out ${isActive ? "scale-[1.04]" : "scale-100"}`}
      >
        <Image
          src={slide.mobileImage}
          alt={slide.heading}
          fill
          className="object-cover"
          sizes="100vw"
          priority={priority}
          loading={priority ? "eager" : "lazy"}
        />
      </div>

      {/* Desktop Gradient Overlay — direction based on text position */}
      <div
        className={`absolute inset-0 z-10 hidden md:block ${
          isRight
            ? "bg-linear-to-l from-black/80 via-black/45 to-transparent"
            : "bg-linear-to-r from-black/80 via-black/45 to-transparent"
        }`}
      />

      {/* Mobile Gradient Overlay — top dark fade */}
      <div className="absolute inset-0 z-10 block md:hidden bg-linear-to-b from-black/55 via-black/20 to-transparent" />

      {/* Subtle Vignette */}
      <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.25)_100%)]" />

      {/* Bottom gradient for mobile pagination readability */}
      <div className="absolute bottom-0 left-0 right-0 z-10 h-28 bg-linear-to-t from-black/25 to-transparent md:hidden" />
    </div>
  );
}

/* =========================================================================
   LUXURY HERO COMPONENT
   ========================================================================= */

export function LuxuryHero() {
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);

  const handleSlideChange = useCallback((swiper: SwiperType) => {
    setActiveIndex(swiper.realIndex);
  }, []);

  const handlePaginationClick = useCallback((index: number) => {
    if (swiperRef.current) {
      swiperRef.current.slideToLoop(index);
    }
  }, []);

  return (
    <section className="relative w-full overflow-hidden bg-charcoal aspect-square md:aspect-21/8">
      <Swiper
        modules={[Autoplay, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        autoplay={{
          delay: 6000,
          disableOnInteraction: false,
          pauseOnMouseEnter: false,
        }}
        loop
        speed={1200}
        allowTouchMove={true}
        breakpoints={{
          768: {
            allowTouchMove: false,
          },
        }}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        onSlideChange={handleSlideChange}
        className="h-full w-full"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={slide.id} className="relative h-full w-full">
            <SlideBackground
              slide={slide}
              isActive={activeIndex === index}
              priority={index === 0}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Text Content Overlay */}
      {slides.map((slide, index) => (
        <SlideContent
          key={slide.id}
          slide={slide}
          isActive={activeIndex === index}
        />
      ))}

      {/* Pagination — Desktop (right side vertical) */}
      <div className="absolute right-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-3 md:flex lg:right-10">
        {slides.map((_, index) => (
          <PaginationDot
            key={index}
            active={activeIndex === index}
            index={index}
            onClick={handlePaginationClick}
          />
        ))}
      </div>

      {/* Pagination — Mobile (bottom center) */}
      <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 gap-3 md:hidden">
        {slides.map((_, index) => (
          <PaginationDot
            key={index}
            active={activeIndex === index}
            index={index}
            onClick={handlePaginationClick}
          />
        ))}
      </div>

      {/* Scroll Indicator — Desktop only */}
      <div className="absolute bottom-8 left-6 z-30 hidden flex-col items-center gap-2 md:flex lg:left-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/50">
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" as const }}
            className="h-8 w-px bg-white/25"
          />
        </motion.div>
      </div>
    </section>
  );
}
