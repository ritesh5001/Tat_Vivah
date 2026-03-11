import React from "react";
import { ArchCarousel } from "./ArchCarousel";
import { images } from "../data/images";

type VibeCarouselProps = {
  onSelectVibe?: (query: string) => void;
};

const vibes = [
  { id: "v1", title: "SHERWANI", query: "sherwani", image: images.categories.wedding },
  { id: "v2", title: "KURTA", query: "kurta", image: images.categories.kurta },
  { id: "v3", title: "INDO WESTERN", query: "indo western", image: images.categories.indoWestern },
  { id: "v4", title: "ACCESSORIES", query: "accessories", image: images.categories.accessories },
];

export function VibeCarousel({ onSelectVibe }: VibeCarouselProps) {
  return (
    <ArchCarousel title="WHAT'S YOUR VIBE?" items={vibes} onPressItem={onSelectVibe} />
  );
}
