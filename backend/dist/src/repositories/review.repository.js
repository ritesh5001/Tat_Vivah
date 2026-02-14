import { prisma } from '../config/db.js';
export class ReviewRepository {
    async findAll() {
        return prisma.review.findMany({
            orderBy: { createdAt: 'desc' },
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
        return prisma.review.delete({ where: { id } });
    }
}
export const reviewRepository = new ReviewRepository();
//# sourceMappingURL=review.repository.js.map