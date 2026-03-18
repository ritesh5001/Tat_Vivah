import { CreateNotificationInput } from './types.js';
export declare class NotificationService {
    /**
     * Core method to create notification and add to queue.
     * IDEMPOTENT: If eventKey is provided and a notification with that key
     * already exists for the user, the duplicate is silently skipped.
     */
    create(data: CreateNotificationInput): Promise<{
        status: import(".prisma/client").$Enums.NotificationStatus;
        type: import(".prisma/client").$Enums.NotificationType;
        id: string;
        role: import(".prisma/client").$Enums.Role | null;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string | null;
        channel: import(".prisma/client").$Enums.NotificationChannel;
        subject: string | null;
        content: string;
        eventKey: string | null;
        isRead: boolean;
        readAt: Date | null;
        sentAt: Date | null;
    }>;
    /**
     * Trigger ORDER_PLACED (Buyer)
     */
    notifyOrderPlaced(userId: string, orderId: string, totalAmount: number): Promise<{
        status: import(".prisma/client").$Enums.NotificationStatus;
        type: import(".prisma/client").$Enums.NotificationType;
        id: string;
        role: import(".prisma/client").$Enums.Role | null;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string | null;
        channel: import(".prisma/client").$Enums.NotificationChannel;
        subject: string | null;
        content: string;
        eventKey: string | null;
        isRead: boolean;
        readAt: Date | null;
        sentAt: Date | null;
    }>;
    /**
     * Trigger SELLER_NEW_ORDER (Seller)
     */
    notifySellerNewOrder(sellerId: string, orderId: string, itemsCount: number): Promise<{
        status: import(".prisma/client").$Enums.NotificationStatus;
        type: import(".prisma/client").$Enums.NotificationType;
        id: string;
        role: import(".prisma/client").$Enums.Role | null;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string | null;
        channel: import(".prisma/client").$Enums.NotificationChannel;
        subject: string | null;
        content: string;
        eventKey: string | null;
        isRead: boolean;
        readAt: Date | null;
        sentAt: Date | null;
    }>;
    /**
     * Trigger PAYMENT_SUCCESS (Buyer)
     */
    notifyPaymentSuccess(userId: string, orderId: string, amount: number): Promise<{
        status: import(".prisma/client").$Enums.NotificationStatus;
        type: import(".prisma/client").$Enums.NotificationType;
        id: string;
        role: import(".prisma/client").$Enums.Role | null;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string | null;
        channel: import(".prisma/client").$Enums.NotificationChannel;
        subject: string | null;
        content: string;
        eventKey: string | null;
        isRead: boolean;
        readAt: Date | null;
        sentAt: Date | null;
    }>;
    /**
     * Trigger PAYMENT_FAILED (Buyer)
     */
    notifyPaymentFailed(userId: string, orderId: string): Promise<{
        status: import(".prisma/client").$Enums.NotificationStatus;
        type: import(".prisma/client").$Enums.NotificationType;
        id: string;
        role: import(".prisma/client").$Enums.Role | null;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string | null;
        channel: import(".prisma/client").$Enums.NotificationChannel;
        subject: string | null;
        content: string;
        eventKey: string | null;
        isRead: boolean;
        readAt: Date | null;
        sentAt: Date | null;
    }>;
    /**
     * Trigger ORDER_SHIPPED (Buyer)
     */
    notifyOrderShipped(userId: string, orderId: string, carrier: string, trackingNumber: string): Promise<{
        status: import(".prisma/client").$Enums.NotificationStatus;
        type: import(".prisma/client").$Enums.NotificationType;
        id: string;
        role: import(".prisma/client").$Enums.Role | null;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string | null;
        channel: import(".prisma/client").$Enums.NotificationChannel;
        subject: string | null;
        content: string;
        eventKey: string | null;
        isRead: boolean;
        readAt: Date | null;
        sentAt: Date | null;
    }>;
    /**
     * Trigger ORDER_DELIVERED (Buyer)
     */
    notifyOrderDelivered(userId: string, orderId: string): Promise<{
        status: import(".prisma/client").$Enums.NotificationStatus;
        type: import(".prisma/client").$Enums.NotificationType;
        id: string;
        role: import(".prisma/client").$Enums.Role | null;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string | null;
        channel: import(".prisma/client").$Enums.NotificationChannel;
        subject: string | null;
        content: string;
        eventKey: string | null;
        isRead: boolean;
        readAt: Date | null;
        sentAt: Date | null;
    }>;
    /**
     * Trigger SELLER_APPROVED (Seller)
     */
    notifySellerApproved(sellerId: string, email?: string | null): Promise<{
        status: import(".prisma/client").$Enums.NotificationStatus;
        type: import(".prisma/client").$Enums.NotificationType;
        id: string;
        role: import(".prisma/client").$Enums.Role | null;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string | null;
        channel: import(".prisma/client").$Enums.NotificationChannel;
        subject: string | null;
        content: string;
        eventKey: string | null;
        isRead: boolean;
        readAt: Date | null;
        sentAt: Date | null;
    }>;
    notifySellerProductApproved(sellerId: string, productTitle: string, email?: string | null): Promise<{
        status: import(".prisma/client").$Enums.NotificationStatus;
        type: import(".prisma/client").$Enums.NotificationType;
        id: string;
        role: import(".prisma/client").$Enums.Role | null;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string | null;
        channel: import(".prisma/client").$Enums.NotificationChannel;
        subject: string | null;
        content: string;
        eventKey: string | null;
        isRead: boolean;
        readAt: Date | null;
        sentAt: Date | null;
    }>;
    notifySellerProductRejected(sellerId: string, productTitle: string, reason: string, email?: string | null): Promise<{
        status: import(".prisma/client").$Enums.NotificationStatus;
        type: import(".prisma/client").$Enums.NotificationType;
        id: string;
        role: import(".prisma/client").$Enums.Role | null;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string | null;
        channel: import(".prisma/client").$Enums.NotificationChannel;
        subject: string | null;
        content: string;
        eventKey: string | null;
        isRead: boolean;
        readAt: Date | null;
        sentAt: Date | null;
    }>;
    /**
     * Trigger ADMIN_ALERT
     */
    notifyAdmin(title: string, message: string): Promise<{
        status: import(".prisma/client").$Enums.NotificationStatus;
        type: import(".prisma/client").$Enums.NotificationType;
        id: string;
        role: import(".prisma/client").$Enums.Role | null;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string | null;
        channel: import(".prisma/client").$Enums.NotificationChannel;
        subject: string | null;
        content: string;
        eventKey: string | null;
        isRead: boolean;
        readAt: Date | null;
        sentAt: Date | null;
    }>;
}
export declare const notificationService: NotificationService;
//# sourceMappingURL=notification.service.d.ts.map