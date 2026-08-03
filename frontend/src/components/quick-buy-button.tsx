"use client";

import * as React from "react";
import { QuickBuyDialog, type QuickBuyIntent } from "@/components/quick-buy-dialog";

/**
 * Client island for the product card's Add to Cart.
 *
 * The card itself is a server component, so the dialog state lives here rather
 * than forcing the whole card — and the grid around it — onto the client.
 */
export function QuickBuyButton({
    productId,
    className,
    label = "Add to Cart",
    intent = "cart",
    children,
}: {
    productId: string;
    className?: string;
    label?: string;
    intent?: QuickBuyIntent;
    children?: React.ReactNode;
}) {
    const [open, setOpen] = React.useState(false);

    return (
        <>
            <button
                type="button"
                className={className}
                onClick={(event) => {
                    // The card is wrapped in a link to the product page; opening the
                    // picker must not also navigate.
                    event.preventDefault();
                    event.stopPropagation();
                    setOpen(true);
                }}
            >
                {children ?? <span className="relative z-10">{label}</span>}
            </button>

            <QuickBuyDialog
                productId={open ? productId : null}
                intent={intent}
                open={open}
                onClose={() => setOpen(false)}
            />
        </>
    );
}
