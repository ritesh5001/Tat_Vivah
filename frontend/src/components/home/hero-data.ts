export interface HeroSlide {
  id: number;
  heading: string;
  subtext: string;
  button: string;
  href: string;
  desktopImage: string;
  mobileImage: string;
  textPosition: "left" | "right";
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    heading: "Crafted for Regal Grooms",
    subtext: "Heritage silhouettes for majestic celebrations.",
    button: "Explore Groom Collection",
    href: "/marketplace",
    desktopImage: "/images/hero/1st desktop banner.jpg",
    mobileImage: "/images/hero/1st mobile banner.jpeg",
    textPosition: "left",
  },
  {
    id: 2,
    heading: "Celebrate In Style",
    subtext: "Modern wedding fashion crafted with elegance.",
    button: "Shop Wedding Looks",
    href: "/marketplace",
    desktopImage: "/images/hero/2nd desktop banner.jpg",
    mobileImage: "/images/hero/2nd mobile banner.jpeg",
    textPosition: "right",
  },
  {
    id: 3,
    heading: "For Every Celebration",
    subtext: "From haldi to reception, complete your story.",
    button: "Discover Collections",
    href: "/marketplace",
    desktopImage: "/images/hero/3rd desktop banner.jpg",
    mobileImage: "/images/hero/3rd mobile banner.jpeg",
    textPosition: "left",
  },
  {
    id: 4,
    heading: "Luxury Meets Tradition",
    subtext: "Premium wedding fashion for modern India.",
    button: "Start Exploring",
    href: "/marketplace",
    desktopImage: "/images/hero/4th desktop banner.jpg",
    mobileImage: "/images/hero/4th mobile banner.jpeg",
    textPosition: "right",
  },
];

export const PRIMARY_HERO_SLIDE = HERO_SLIDES[0];
