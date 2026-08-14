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

/** Stable commerce action whose motion is scoped to this button alone. */
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
        "group/flow relative isolate inline-flex h-9 w-full cursor-pointer items-center justify-center overflow-hidden rounded-full! border px-4",
        "transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out",
        "active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        filled
          ? "border-charcoal bg-charcoal text-white hover:border-gold hover:bg-gold hover:shadow-[0_5px_16px_rgba(183,149,108,0.28)] focus-visible:border-gold focus-visible:bg-gold"
          : "border-charcoal bg-background text-charcoal hover:bg-charcoal hover:text-white hover:shadow-[0_5px_16px_rgba(44,40,37,0.18)] focus-visible:bg-charcoal focus-visible:text-white",
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/2 z-0 w-1/3 -skew-x-12 bg-white/20 opacity-0 blur-[1px] transition-[left,opacity] duration-500 ease-out group-hover/flow:left-[120%] group-hover/flow:opacity-100 group-focus-visible/flow:left-[120%] group-focus-visible/flow:opacity-100"
      />

      <span className="relative z-10 inline-flex items-center gap-3 transition-transform duration-200 ease-out group-hover/flow:translate-x-0.5 group-focus-visible/flow:translate-x-0.5">
        <Icon
          className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 ease-out group-hover/flow:-translate-y-0.5 group-focus-visible/flow:-translate-y-0.5"
          strokeWidth={1.8}
          aria-hidden
        />
        <span>{children}</span>
      </span>
    </button>
  );
});

CommerceFlowButton.displayName = "CommerceFlowButton";
