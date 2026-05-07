const DEFAULT_COLOR_KEY = '__no_color__';
export function normalizeVariantColorKey(color) {
    const normalized = color?.trim().toLowerCase();
    return normalized && normalized.length > 0 ? normalized : DEFAULT_COLOR_KEY;
}
export function sanitizeVariantImages(images) {
    if (!Array.isArray(images))
        return [];
    const sanitized = [];
    const seen = new Set();
    for (const image of images) {
        if (typeof image !== 'string')
            continue;
        const trimmed = image.trim();
        if (!trimmed || seen.has(trimmed))
            continue;
        seen.add(trimmed);
        sanitized.push(trimmed);
    }
    return sanitized;
}
export function arraysEqual(left, right) {
    if (left.length !== right.length)
        return false;
    return left.every((value, index) => value === right[index]);
}
export function resolveColorScopedGallery(variants, color) {
    const targetKey = normalizeVariantColorKey(color);
    for (const variant of variants) {
        if (normalizeVariantColorKey(variant.color) !== targetKey)
            continue;
        const sanitized = sanitizeVariantImages(variant.images);
        if (sanitized.length > 0) {
            return sanitized;
        }
    }
    return [];
}
export function applyColorScopedImages(variants) {
    const firstGalleryByColor = new Map();
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
export function buildColorScopedImageUpdates(variants) {
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
//# sourceMappingURL=color-variant-images.service.js.map