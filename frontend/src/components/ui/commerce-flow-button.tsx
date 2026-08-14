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
 * Website counterpart to the native FlowActionButton. The timings, icon gap,
 * circular fill, icon travel and active white label intentionally match.
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
        "group relative isolate inline-flex h-9 w-full cursor-pointer items-center justify-center overflow-hidden rounded-full! border px-4",
        "transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
        "hover:scale-[0.965] active:scale-[0.95]",
        "focus-visible:scale-[0.965] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        filled
          ? "border-charcoal bg-charcoal text-white"
          : "border-charcoal bg-background text-charcoal",
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 scale-[0.15] rounded-full! opacity-0",
          "transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.19,1,0.22,1)]",
          "group-hover:scale-[15] group-hover:opacity-100 group-active:scale-[15] group-active:opacity-100 group-focus-visible:scale-[15] group-focus-visible:opacity-100",
          filled ? "bg-gold" : "bg-charcoal"
        )}
      />

      <span
        aria-hidden
        className="pointer-events-none absolute left-[-26px] z-20 flex opacity-0 transition-[left,opacity] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:left-3.5 group-hover:opacity-100 group-active:left-3.5 group-active:opacity-100 group-focus-visible:left-3.5 group-focus-visible:opacity-100"
      >
        <Icon className="h-3.5 w-3.5 text-white" strokeWidth={1.8} />
      </span>

      <span className="relative z-10 inline-flex items-center gap-3 transition-[transform,opacity] duration-300 group-hover:translate-x-3 group-hover:opacity-0 group-active:translate-x-3 group-active:opacity-0 group-focus-visible:translate-x-3 group-focus-visible:opacity-0">
        <Icon className="h-3 w-3" strokeWidth={1.8} aria-hidden />
        <span>{children}</span>
      </span>

      <span className="pointer-events-none absolute z-10 -translate-x-2.5 opacity-0 text-white transition-[transform,opacity] duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-active:translate-x-0 group-active:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
        {children}
      </span>
    </button>
  );
});

CommerceFlowButton.displayName = "CommerceFlowButton";
