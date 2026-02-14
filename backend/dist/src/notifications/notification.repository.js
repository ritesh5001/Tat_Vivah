import { prisma } from '../config/db.js';
import { NotificationStatus } from '@prisma/client';
export class NotificationRepository {
    async create(data) {
        return prisma.notification.create({
            data: {
                userId: data.userId,
                role: data.role,
                type: data.type,
                channel: data.channel,
                status: NotificationStatus.PENDING,
                subject: data.subject,
                content: data.content,
                metadata: data.metadata || {}
            }
        });
    }
    async findById(id) {
        return prisma.notification.findUnique({ where: { id } });
    }
    async updateStatus(id, status, sentAt) {
        return prisma.notification.update({
            where: { id },
            data: { status, sentAt }
        });
    }
    async createEvent(notificationId, provider, status, providerMessageId, error) {
        return prisma.notificationEvent.create({
            data: {
                notificationId,
                provider,
                status,
                providerMessageId,
                error
            }
        });
    }
    async findAll(page = 1, limit = 20) {
        const [notifications, total] = await Promise.all([
            prisma.notification.findMany({
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.notification.count()
        ]);
        return { notifications, total };
    }
}
export const notificationRepository = new NotificationRepository();
//# sourceMappingURL=notification.repository.js.map