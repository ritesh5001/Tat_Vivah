import { prisma } from '../config/db.js';
import { Notification, NotificationEvent, NotificationStatus } from '@prisma/client';
import { CreateNotificationInput } from './types.js';

export class NotificationRepository {
    async create(data: CreateNotificationInput): Promise<Notification> {
        const createData: {
            userId?: string | null;
            role?: Notification['role'];
            type: Notification['type'];
            channel: Notification['channel'];
            status: NotificationStatus;
            subject?: string;
            content: string;
            metadata: any;
        } = {
            type: data.type,
            channel: data.channel,
            status: NotificationStatus.PENDING,
            content: data.content,
            metadata: data.metadata || {}
        };

        if (data.userId !== undefined) {
            createData.userId = data.userId;
        }
        if (data.role !== undefined) {
            createData.role = data.role;
        }
        if (data.subject !== undefined) {
            createData.subject = data.subject;
        }

        return prisma.notification.create({
            data: createData
        });
    }

    async findById(id: string): Promise<Notification | null> {
        return prisma.notification.findUnique({ where: { id } });
    }

    async updateStatus(id: string, status: NotificationStatus, sentAt?: Date): Promise<Notification> {
        const updateData: {
            status: NotificationStatus;
            sentAt?: Date;
        } = { status };

        if (sentAt !== undefined) {
            updateData.sentAt = sentAt;
        }

        return prisma.notification.update({
            where: { id },
            data: updateData
        });
    }

    async createEvent(notificationId: string, provider: string, status: NotificationStatus, providerMessageId?: string, error?: string): Promise<NotificationEvent> {
        const eventData: {
            notificationId: string;
            provider: string;
            status: NotificationStatus;
            providerMessageId?: string;
            error?: string;
        } = {
            notificationId,
            provider,
            status,
        };

        if (providerMessageId !== undefined) {
            eventData.providerMessageId = providerMessageId;
        }

        if (error !== undefined) {
            eventData.error = error;
        }

        return prisma.notificationEvent.create({
            data: eventData
        });
    }

    async findAll(page: number = 1, limit: number = 20): Promise<{ notifications: Notification[], total: number }> {
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
