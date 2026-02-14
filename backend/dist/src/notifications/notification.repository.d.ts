import { Notification, NotificationEvent, NotificationStatus } from '@prisma/client';
import { CreateNotificationInput } from './types.js';
export declare class NotificationRepository {
    create(data: CreateNotificationInput): Promise<Notification>;
    findById(id: string): Promise<Notification | null>;
    updateStatus(id: string, status: NotificationStatus, sentAt?: Date): Promise<Notification>;
    createEvent(notificationId: string, provider: string, status: NotificationStatus, providerMessageId?: string, error?: string): Promise<NotificationEvent>;
    findAll(page?: number, limit?: number): Promise<{
        notifications: Notification[];
        total: number;
    }>;
}
export declare const notificationRepository: NotificationRepository;
//# sourceMappingURL=notification.repository.d.ts.map