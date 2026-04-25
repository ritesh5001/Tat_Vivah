type VariantImageCarrier = {
    id: string;
    color?: string | null;
    images?: string[] | null;
};
export declare function normalizeVariantColorKey(color?: string | null): string;
export declare function sanitizeVariantImages(images?: string[] | null): string[];
export declare function arraysEqual(left: string[], right: string[]): boolean;
export declare function resolveColorScopedGallery(variants: Array<{
    color?: string | null;
    images?: string[] | null;
}>, color?: string | null): string[];
export declare function applyColorScopedImages<T extends VariantImageCarrier>(variants: T[]): Array<T & {
    images: string[];
}>;
export declare function buildColorScopedImageUpdates<T extends VariantImageCarrier>(variants: T[]): Array<{
    id: string;
    images: string[];
}>;
export {};
//# sourceMappingURL=color-variant-images.service.d.ts.map