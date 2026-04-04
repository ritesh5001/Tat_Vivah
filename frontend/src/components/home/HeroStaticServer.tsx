import Image from "next/image";
import Link from "next/link";
import { HERO_SLIDES, PRIMARY_HERO_SLIDE } from "@/components/home/hero-data";

export function HeroStaticServer() {
  const slide = PRIMARY_HERO_SLIDE;
  const secondarySlides = HERO_SLIDES.slice(1);

  return (
    <section aria-label="Hero">
      <div className="relative w-full overflow-hidden bg-charcoal aspect-square md:aspect-21/8">
        <div className="absolute inset-0 overflow-hidden">
          <div className="hidden md:block absolute inset-0">
            <Image
              src={slide.desktopImage}
              alt={slide.heading}
              fill
              className="object-cover"
              sizes="100vw"
              quality={60}
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
              quality={60}
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
      </div>

      {secondarySlides.length > 0 ? (
        <div className="border-t border-border-soft bg-background">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            <div className="flex gap-3 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
              {secondarySlides.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group relative block h-40 min-w-[78vw] overflow-hidden border border-border-soft sm:min-w-[46vw] lg:min-w-[31%]"
                >
                  <Image
                    src={item.desktopImage}
                    alt={item.heading}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 78vw, (max-width: 1024px) 46vw, 31vw"
                    quality={60}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/35 to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
                    <h2 className="font-serif text-lg leading-tight">{item.heading}</h2>
                    <p className="mt-1 text-xs uppercase tracking-[0.15em] text-white/85">{item.button}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
