import { prisma } from '../config/db.js';
export class ReviewRepository {
    async findAll() {
        return prisma.review.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
                product: { select: { id: true, title: true } },
                user: {
                    select: {
                        id: true,
                        email: true,
                        user_profiles: { select: { full_name: true, avatar: true } },
                    },
                },
            },
        });
    }
    async deleteById(id) {
        return prisma.review.update({
            where: { id },
            data: { isHidden: true },
        });
    }
}
export const reviewRepository = new ReviewRepository();
//# sourceMappingURL=review.repository.js.map