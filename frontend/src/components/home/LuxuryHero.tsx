"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { ArrowRight } from "lucide-react";

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
}

const slides: HeroSlide[] = [
  {
    id: 1,
    heading: "Define Your Wedding Presence",
    subtext: "Luxury groomwear curated for unforgettable moments.",
    button: "Explore Groom Collection",
    href: "/marketplace",
    desktopImage: "/images/hero/hero-desktop-1.svg",
    mobileImage: "/images/hero/hero-mobile-1.svg",
  },
  {
    id: 2,
    heading: "Celebrate In Style",
    subtext: "Modern wedding fashion crafted with elegance.",
    button: "Shop Wedding Looks",
    href: "/marketplace",
    desktopImage: "/images/hero/hero-desktop-2.svg",
    mobileImage: "/images/hero/hero-mobile-2.svg",
  },
  {
    id: 3,
    heading: "For Every Celebration",
    subtext: "From haldi to reception, complete your story.",
    button: "Discover Collections",
    href: "/marketplace",
    desktopImage: "/images/hero/hero-desktop-3.svg",
    mobileImage: "/images/hero/hero-mobile-3.svg",
  },
  {
    id: 4,
    heading: "Luxury Meets Tradition",
    subtext: "Premium wedding fashion for modern India.",
    button: "Start Exploring",
    href: "/marketplace",
    desktopImage: "/images/hero/hero-desktop-4.svg",
    mobileImage: "/images/hero/hero-mobile-4.svg",
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
    transition: { duration: 0.8, ease: "easeOut" as const },
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
    transition: { duration: 0.8, ease: "easeOut" as const, delay: 0.2 },
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
    transition: { duration: 0.8, ease: "easeOut" as const, delay: 0.4 },
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
      className="group relative flex items-center justify-center p-1"
    >
      <span
        className={`
          block rounded-full transition-all duration-500 ease-out
          ${
            active
              ? "h-3 w-3 bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]"
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
  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key={slide.id}
          className="absolute inset-0 z-20 flex items-center"
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-16">
            <div className="max-w-xl">
              {/* Heading */}
              <motion.h1
                variants={headingVariants}
                className="font-serif text-4xl font-light leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
              >
                {slide.heading}
              </motion.h1>

              {/* Subtext */}
              <motion.p
                variants={subtextVariants}
                className="mt-5 max-w-md text-base leading-relaxed text-white/80 sm:mt-6 sm:text-lg"
              >
                {slide.subtext}
              </motion.p>

              {/* Button */}
              <motion.div variants={buttonVariants} className="mt-8 sm:mt-10">
                <Link
                  href={slide.href}
                  className="group/btn inline-flex items-center gap-3 rounded-full bg-[#E64A19] px-8 py-3 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:bg-[#D84315] hover:shadow-[0_4px_24px_rgba(230,74,25,0.4)] hover:scale-105 active:scale-[0.98]"
                >
                  <span>{slide.button}</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
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
  index,
  priority,
}: {
  slide: HeroSlide;
  isActive: boolean;
  index: number;
  priority: boolean;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Desktop Image */}
      <div
        className={`
          hidden md:block absolute inset-0
          transition-transform duration-6000 ease-[cubic-bezier(0.25,0.1,0.25,1)]
          ${isActive ? "scale-105" : "scale-100"}
        `}
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
        className={`
          block md:hidden absolute inset-0
          transition-transform duration-6000 ease-[cubic-bezier(0.25,0.1,0.25,1)]
          ${isActive ? "scale-105" : "scale-100"}
        `}
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

      {/* Dark Gradient Overlay (left to right) */}
      <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/40 to-transparent z-10" />

      {/* Subtle Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.3)_100%)] z-10" />

      {/* Bottom gradient for pagination readability */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-black/30 to-transparent z-10" />
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
    <section className="relative h-screen w-full overflow-hidden bg-charcoal">
      {/* Swiper Carousel */}
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
              index={index}
              priority={index === 0}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Text Content Overlay (outside Swiper for smooth AnimatePresence) */}
      {slides.map((slide, index) => (
        <SlideContent
          key={slide.id}
          slide={slide}
          isActive={activeIndex === index}
        />
      ))}

      {/* Custom Pagination - Desktop (right side vertical) */}
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

      {/* Custom Pagination - Mobile (bottom center) */}
      <div className="absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 gap-3 md:hidden">
        {slides.map((_, index) => (
          <PaginationDot
            key={index}
            active={activeIndex === index}
            index={index}
            onClick={handlePaginationClick}
          />
        ))}
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-6 z-30 hidden md:flex flex-col items-center gap-2 lg:left-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/60">
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="h-8 w-px bg-white/30"
          />
        </motion.div>
      </div>
    </section>
  );
}
