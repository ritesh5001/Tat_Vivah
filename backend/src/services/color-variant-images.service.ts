type VariantImageCarrier = {
    id: string;
    color?: string | null;
    images?: string[] | null;
};

const DEFAULT_COLOR_KEY = '__no_color__';

export function normalizeVariantColorKey(color?: string | null): string {
    const normalized = color?.trim().toLowerCase();
    return normalized && normalized.length > 0 ? normalized : DEFAULT_COLOR_KEY;
}

export function sanitizeVariantImages(images?: string[] | null): string[] {
    if (!Array.isArray(images)) return [];

    const sanitized: string[] = [];
    const seen = new Set<string>();

    for (const image of images) {
        if (typeof image !== 'string') continue;
        const trimmed = image.trim();
        if (!trimmed || seen.has(trimmed)) continue;
        seen.add(trimmed);
        sanitized.push(trimmed);
    }

    return sanitized;
}

export function arraysEqual(left: string[], right: string[]): boolean {
    if (left.length !== right.length) return false;
    return left.every((value, index) => value === right[index]);
}

export function resolveColorScopedGallery(
    variants: Array<{ color?: string | null; images?: string[] | null }>,
    color?: string | null
): string[] {
    const targetKey = normalizeVariantColorKey(color);
    for (const variant of variants) {
        if (normalizeVariantColorKey(variant.color) !== targetKey) continue;
        const sanitized = sanitizeVariantImages(variant.images);
        if (sanitized.length > 0) {
            return sanitized;
        }
    }

    return [];
}

export function applyColorScopedImages<T extends VariantImageCarrier>(
    variants: T[]
): Array<T & { images: string[] }> {
    const firstGalleryByColor = new Map<string, string[]>();

    for (const variant of variants) {
        const key = normalizeVariantColorKey(variant.color);
        const sanitized = sanitizeVariantImages(variant.images);
        if (sanitized.length > 0 && !firstGalleryByColor.has(key)) {
            firstGalleryByColor.set(key, sanitized);
        }
    }

    return variants.map((variant) => ({
        ...variant,
        images: firstGalleryByColor.get(normalizeVariantColorKey(variant.color)) ?? [],
    }));
}

export function buildColorScopedImageUpdates<T extends VariantImageCarrier>(
    variants: T[]
): Array<{ id: string; images: string[] }> {
    const normalized = applyColorScopedImages(variants);

    return normalized
        .filter((variant, index) => {
            const currentImages = sanitizeVariantImages(variants[index]?.images);
            return !arraysEqual(currentImages, variant.images);
        })
        .map((variant) => ({
            id: variant.id,
            images: variant.images,
        }));
}
