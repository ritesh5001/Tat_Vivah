"use client";

import * as React from "react";
import { ArrowRight, CreditCard, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

export type CommerceFlowAction = "cart" | "buy";

export interface CommerceFlowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  action: CommerceFlowAction;
  variant?: "filled" | "outline";
}

/**
 * Flow action shared by every website Add to Cart and Buy Now CTA.
 *
 * On hover a disc grows from the centre until it covers the button, the resting
 * commerce icon rides out to the right and an arrow arrives from the left while
 * the label slides across. Its named group prevents a surrounding product-card
 * hover from activating it.
 *
 * Every transition names `scale` and `translate` explicitly: Tailwind v4 emits
 * those as standalone CSS properties, so a `transition-[transform]` never
 * animates them and the fill lands in a single frame.
 */
export const CommerceFlowButton = React.forwardRef<
  HTMLButtonElement,
  CommerceFlowButtonProps
>(function CommerceFlowButton(
  {
    action,
    variant = "outline",
    className,
    children,
    type = "button",
    ...props
  },
  ref
) {
  const Icon = action === "cart" ? ShoppingCart : CreditCard;
  const filled = variant === "filled";

  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        // A container, not just a group: the icon choreography needs room, and a
        // product-card button on a phone is half the width of the same button on
        // the detail page. The query keys off the button, so the same component
        // adapts in a 2-up grid and a full-width CTA without a viewport guess.
        "group/flow @container/flow relative isolate inline-flex h-9 w-full cursor-pointer items-center justify-center overflow-hidden rounded-none! border px-4",
        "transition-[color,border-color,border-radius,box-shadow,scale] duration-600 ease-[cubic-bezier(0.23,1,0.32,1)]",
        // The corner softening is the shape reacting to the fill, not a restyle.
        "hover:rounded-[10px]! hover:border-transparent focus-visible:rounded-[10px]!",
        "active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        filled
          ? "border-charcoal bg-charcoal text-white hover:shadow-[0_5px_16px_rgba(183,149,108,0.28)]"
          : "border-charcoal bg-background text-charcoal hover:text-white hover:shadow-[0_5px_16px_rgba(44,40,37,0.18)] focus-visible:text-white",
        className
      )}
      {...props}
    >
      {/* Sized off the button's own width so the disc always outgrows the
          button it fills — a fixed scale factor covered a 150px card button
          and fell short on a full-width product-detail one. */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-1/2 top-1/2 z-0 aspect-square w-[135%] -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full opacity-0",
          "transition-[scale,opacity] duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]",
          "group-hover/flow:scale-100 group-hover/flow:opacity-100",
          "group-focus-visible/flow:scale-100 group-focus-visible/flow:opacity-100",
          filled ? "bg-gold" : "bg-charcoal"
        )}
      />

      {/* Arrives from off-canvas once the fill is under way. Below 180px the
          label already spans the button, so both icons stand down rather than
          crowd it — the fill still reads as the same gesture. */}
      <ArrowRight
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-[-25%] z-10 h-4 w-4 text-white @max-[180px]/flow:hidden",
          "transition-all duration-800 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          "group-hover/flow:left-4 group-focus-visible/flow:left-4"
        )}
        strokeWidth={1.8}
      />

      <span
        className={cn(
          "relative z-10 whitespace-nowrap",
          "transition-[translate] duration-800 ease-out",
          "@[180px]/flow:-translate-x-2",
          "@[180px]/flow:group-hover/flow:translate-x-2",
          "@[180px]/flow:group-focus-visible/flow:translate-x-2"
        )}
      >
        {children}
      </span>

      {/* Rides out the way the arrow came in. */}
      <Icon
        aria-hidden
        className={cn(
          "pointer-events-none absolute right-4 z-10 h-3.5 w-3.5 @max-[180px]/flow:hidden",
          "transition-all duration-800 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          "group-hover/flow:right-[-25%] group-focus-visible/flow:right-[-25%]"
        )}
        strokeWidth={1.8}
      />
    </button>
  );
});

CommerceFlowButton.displayName = "CommerceFlowButton";
