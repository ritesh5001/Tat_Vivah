"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const headingVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" as const },
  },
};

const subtextVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" as const, delay: 0.2 },
  },
};

const buttonVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const, delay: 0.4 },
  },
};

export function WeddingSectionBanner() {
  return (
    <section className="relative mt-24 w-full overflow-hidden md:mt-32">
      <div className="relative h-[70vh] w-full overflow-hidden aspect-square md:h-[80vh] md:aspect-21/8">
        <div className="absolute inset-0 hidden md:block">
          <Image
            src="/images/hero/wedding section desktop banner.jpeg"
            alt="Wedding season essentials"
            fill
            className="object-cover"
            sizes="100vw"
            quality={70}
            priority={false}
            loading="lazy"
          />
        </div>

        <div className="absolute inset-0 block md:hidden">
          <Image
            src="/images/hero/wedding section mobile banner.jpeg"
            alt="Wedding season essentials"
            fill
            className="object-cover"
            sizes="100vw"
            quality={70}
            priority={false}
            loading="lazy"
          />
        </div>

        <div className="absolute inset-0 z-10 hidden bg-linear-to-l from-black/80 via-black/45 to-transparent md:block" />
        <div className="absolute inset-0 z-10 block bg-linear-to-b from-black/55 via-black/20 to-transparent md:hidden" />
        <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.25)_100%)]" />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="absolute inset-0 z-20 flex items-end justify-center px-6 pb-12 pt-[20%] text-center md:items-center md:justify-start md:px-0 md:pb-0 md:pt-0"
        >
          <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-16">
            <div className="max-w-xl text-center md:ml-auto md:text-right">
              <motion.h2
                variants={headingVariants}
                className="font-serif text-3xl font-light leading-[1.1] tracking-tight text-white drop-shadow-[0_16px_32px_rgba(0,0,0,0.75)] sm:text-4xl md:text-5xl lg:text-6xl"
              >
                Wedding Season Essentials
              </motion.h2>

              <motion.p
                variants={subtextVariants}
                className="mt-4 ml-auto max-w-md text-sm leading-relaxed text-white/80 drop-shadow-[0_12px_28px_rgba(0,0,0,0.6)] sm:mt-5 sm:text-base md:text-lg"
              >
                Curated styles crafted for unforgettable celebrations.
              </motion.p>

              <motion.div variants={buttonVariants} className="mt-7 sm:mt-9 md:flex md:justify-end">
                <Link
                  href="/marketplace"
                  className="inline-flex items-center justify-center rounded-none border border-gold-light/50 bg-gold px-8 py-3 text-[11px] font-medium uppercase tracking-[0.22em] text-white shadow-[0_8px_24px_rgba(183,149,108,0.35)] backdrop-blur-[2px] transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-dark hover:shadow-[0_12px_28px_rgba(183,149,108,0.45)] sm:px-10 sm:py-3.5"
                >
                  Explore Wedding Collection
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
