"use client";

import * as React from "react";
import { CreditCard, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

export type CommerceFlowAction = "cart" | "buy";

export interface CommerceFlowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  action: CommerceFlowAction;
  variant?: "filled" | "outline";
}

/**
 * Rectangular flow action shared by every website Add to Cart and Buy Now CTA.
 * Its named group prevents a surrounding product-card hover from activating it.
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
        "group/flow relative isolate inline-flex h-9 w-full cursor-pointer items-center justify-center overflow-hidden rounded-none! border px-4",
        "transition-[border-color,color,box-shadow,transform] duration-600 ease-[cubic-bezier(0.23,1,0.32,1)]",
        "active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        filled
          ? "border-charcoal bg-charcoal text-white hover:border-gold hover:shadow-[0_5px_16px_rgba(183,149,108,0.28)] focus-visible:border-gold"
          : "border-charcoal bg-background text-charcoal hover:border-charcoal hover:text-white hover:shadow-[0_5px_16px_rgba(44,40,37,0.18)] focus-visible:text-white",
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-1/2 top-1/2 z-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 scale-[0.1] rounded-full opacity-0",
          "transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]",
          "group-hover/flow:scale-[22] group-hover/flow:opacity-100 group-focus-visible/flow:scale-[22] group-focus-visible/flow:opacity-100",
          filled ? "bg-gold" : "bg-charcoal"
        )}
      />

      <span className="relative z-10 inline-flex items-center gap-3 transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/flow:translate-x-1 group-focus-visible/flow:translate-x-1">
        <Icon
          className="h-3.5 w-3.5 shrink-0 transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/flow:-translate-x-1 group-hover/flow:scale-110 group-focus-visible/flow:-translate-x-1 group-focus-visible/flow:scale-110"
          strokeWidth={1.8}
          aria-hidden
        />
        <span>{children}</span>
      </span>
    </button>
  );
});

CommerceFlowButton.displayName = "CommerceFlowButton";
