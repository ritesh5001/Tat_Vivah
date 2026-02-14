import { ApiError } from '../errors/ApiError.js';
import { bestsellerRepository } from '../repositories/bestseller.repository.js';
import { prisma } from '../config/db.js';
import { CACHE_KEYS, getFromCache, invalidateCache, setCache } from '../utils/cache.util.js';
const DEFAULT_LIMIT = 4;
export class BestsellerService {
    async listPublic(limit = DEFAULT_LIMIT) {
        const cacheKey = CACHE_KEYS.BESTSELLERS_LIST;
        const cached = await getFromCache(cacheKey);
        if (cached) {
            return cached;
        }
        const items = await bestsellerRepository.listPublic(limit);
        const products = items.map((item) => {
            const prices = item.product.variants.map((variant) => variant.price);
            const minPrice = prices.length ? Math.min(...prices) : null;
            return {
                id: item.id,
                productId: item.productId,
                position: item.position,
                title: item.product.title,
                image: item.product.images?.[0] ?? null,
                categoryName: item.product.category?.name ?? null,
                minPrice,
            };
        });
        const response = { products };
        await setCache(cacheKey, response);
        return response;
    }
    async listAdmin() {
        const items = await bestsellerRepository.listAdmin();
        return {
            bestsellers: items.map((item) => ({
                id: item.id,
                productId: item.productId,
                position: item.position,
                title: item.product.title,
                categoryName: item.product.category?.name ?? null,
                sellerEmail: item.product.seller?.email ?? null,
                isPublished: item.product.isPublished,
                deletedByAdmin: item.product.deletedByAdmin,
                image: item.product.images?.[0] ?? null,
            })),
        };
    }
    async add(productId, position) {
        const currentCount = await bestsellerRepository.countAll();
        if (currentCount >= DEFAULT_LIMIT) {
            throw ApiError.badRequest('Only 4 products can be marked as bestsellers');
        }
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            throw ApiError.notFound('Product not found');
        }
        if (product.deletedByAdmin) {
            throw ApiError.badRequest('Product deleted by admin');
        }
        const existing = await bestsellerRepository.findByProductId(productId);
        if (existing) {
            throw ApiError.conflict('Product already in bestsellers');
        }
        const finalPosition = position ?? (await bestsellerRepository.getMaxPosition()) + 1;
        const created = await bestsellerRepository.create(productId, finalPosition);
        await invalidateCache(CACHE_KEYS.BESTSELLERS_LIST);
        return created;
    }
    async update(id, position) {
        const updated = await bestsellerRepository.update(id, position);
        await invalidateCache(CACHE_KEYS.BESTSELLERS_LIST);
        return updated;
    }
    async remove(id) {
        await bestsellerRepository.delete(id);
        await invalidateCache(CACHE_KEYS.BESTSELLERS_LIST);
    }
    async removeByProductId(productId) {
        await bestsellerRepository.deleteByProductId(productId);
        await invalidateCache(CACHE_KEYS.BESTSELLERS_LIST);
    }
}
export const bestsellerService = new BestsellerService();
//# sourceMappingURL=bestseller.service.js.map