"use client";

import * as React from "react";
import { Check } from "lucide-react";
import {
    SWATCH_GROUPS,
    isLightHex,
    normalizeHex,
} from "@/lib/color-swatches";

/**
 * Grid of swatches an admin picks from for one vendor-named colour. The name is
 * the vendor's; this only chooses the hex the storefront paints.
 */
export function ColorSwatchPicker({
    colorLabel,
    value,
    onChange,
}: {
    colorLabel: string;
    value: string | null;
    onChange: (hex: string | null) => void;
}) {
    const selected = normalizeHex(value);
    const [custom, setCustom] = React.useState(selected ?? "#000000");

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Swatch for {colorLabel}
                </p>
                <div className="flex items-center gap-2">
                    {selected ? (
                        <>
                            <span
                                className="h-5 w-5 rounded-full border border-border-soft"
                                style={{ backgroundColor: selected }}
                            />
                            <span className="text-[11px] uppercase text-muted-foreground">
                                {selected}
                            </span>
                            <button
                                type="button"
                                onClick={() => onChange(null)}
                                className="text-[11px] text-muted-foreground underline hover:text-foreground"
                            >
                                Clear
                            </button>
                        </>
                    ) : (
                        <span className="text-[11px] text-muted-foreground">
                            Not set — no circle will show
                        </span>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                {SWATCH_GROUPS.map((group) => (
                    <div key={group.family} className="space-y-1">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                            {group.family}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {group.options.map((option) => {
                                const isSelected = selected === option.hex;
                                return (
                                    <button
                                        key={option.hex}
                                        type="button"
                                        title={`${option.label} (${option.hex})`}
                                        aria-label={`${option.label} ${option.hex}`}
                                        aria-pressed={isSelected}
                                        onClick={() => onChange(option.hex)}
                                        className={`relative h-7 w-7 rounded-full transition ${
                                            isSelected
                                                ? "ring-2 ring-gold ring-offset-2 ring-offset-card"
                                                : isLightHex(option.hex)
                                                  ? "border border-border-soft hover:ring-1 hover:ring-gold/50"
                                                  : "hover:ring-1 hover:ring-gold/50"
                                        }`}
                                        style={{ backgroundColor: option.hex }}
                                    >
                                        {isSelected && (
                                            <Check
                                                className={`absolute inset-0 m-auto h-3.5 w-3.5 ${
                                                    isLightHex(option.hex)
                                                        ? "text-charcoal"
                                                        : "text-white"
                                                }`}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-2">
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Custom
                </p>
                <input
                    type="color"
                    value={custom}
                    onChange={(event) => {
                        setCustom(event.target.value);
                        onChange(event.target.value);
                    }}
                    className="h-7 w-12 cursor-pointer border border-border-soft bg-card"
                />
            </div>
        </div>
    );
}
