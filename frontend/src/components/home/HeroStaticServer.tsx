import Image from "next/image";
import Link from "next/link";
import { PRIMARY_HERO_SLIDE } from "@/components/home/hero-data";

export function HeroStaticServer() {
  const slide = PRIMARY_HERO_SLIDE;

  return (
    <section className="relative w-full overflow-hidden bg-charcoal aspect-square md:aspect-21/8" aria-label="Hero">
      <div className="absolute inset-0 overflow-hidden">
        <div className="hidden md:block absolute inset-0">
          <Image
            src={slide.desktopImage}
            alt={slide.heading}
            fill
            className="object-cover"
            sizes="100vw"
            quality={80}
            priority
            fetchPriority="high"
          />
        </div>

        <div className="block md:hidden absolute inset-0">
          <Image
            src={slide.mobileImage}
            alt={slide.heading}
            fill
            className="object-cover"
            sizes="100vw"
            quality={80}
            priority
            fetchPriority="high"
          />
        </div>

        <div className="absolute inset-0 z-10 hidden md:block bg-linear-to-r from-black/80 via-black/45 to-transparent" />
        <div className="absolute inset-0 z-10 block md:hidden bg-linear-to-b from-black/55 via-black/20 to-transparent" />
        <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.25)_100%)]" />
        <div className="absolute bottom-0 left-0 right-0 z-10 h-28 bg-linear-to-t from-black/25 to-transparent md:hidden" />
      </div>

      <div className="absolute inset-0 z-20 flex items-end justify-center px-6 pb-12 sm:pb-16 md:items-center md:pb-0 md:px-0 md:justify-start">
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-16">
          <div className="max-w-xl text-center md:text-left">
            <h1 className="font-serif text-3xl font-light leading-[1.1] tracking-tight text-white drop-shadow-[0_16px_32px_rgba(0,0,0,0.75)] sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
              {slide.heading}
            </h1>

            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/80 drop-shadow-[0_12px_28px_rgba(0,0,0,0.6)] sm:mt-5 sm:text-base md:text-lg">
              {slide.subtext}
            </p>

            <div className="mt-7 sm:mt-9">
              <Link
                href={slide.href}
                className="inline-flex items-center justify-center rounded-none border border-gold-light/50 bg-gold px-8 py-3 text-[11px] font-medium uppercase tracking-[0.22em] text-white shadow-[0_8px_24px_rgba(183,149,108,0.35)] backdrop-blur-[2px] transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-dark hover:shadow-[0_12px_28px_rgba(183,149,108,0.45)] sm:px-10 sm:py-3.5"
              >
                {slide.button}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
