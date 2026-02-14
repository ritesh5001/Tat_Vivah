import { CreateNotificationInput } from './types.js';
export declare class NotificationService {
    /**
     * Core method to create notification and add to queue
     */
    create(data: CreateNotificationInput): Promise<{
        type: import(".prisma/client").$Enums.NotificationType;
        status: import(".prisma/client").$Enums.NotificationStatus;
        id: string;
        role: import(".prisma/client").$Enums.Role | null;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string | null;
        channel: import(".prisma/client").$Enums.NotificationChannel;
        subject: string | null;
        content: string;
        sentAt: Date | null;
    }>;
    /**
     * Trigger ORDER_PLACED (Buyer)
     */
    notifyOrderPlaced(userId: string, orderId: string, totalAmount: number): Promise<{
        type: import(".prisma/client").$Enums.NotificationType;
        status: import(".prisma/client").$Enums.NotificationStatus;
        id: string;
        role: import(".prisma/client").$Enums.Role | null;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string | null;
        channel: import(".prisma/client").$Enums.NotificationChannel;
        subject: string | null;
        content: string;
        sentAt: Date | null;
    }>;
    /**
     * Trigger SELLER_NEW_ORDER (Seller)
     */
    notifySellerNewOrder(sellerId: string, orderId: string, itemsCount: number): Promise<{
        type: import(".prisma/client").$Enums.NotificationType;
        status: import(".prisma/client").$Enums.NotificationStatus;
        id: string;
        role: import(".prisma/client").$Enums.Role | null;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string | null;
        channel: import(".prisma/client").$Enums.NotificationChannel;
        subject: string | null;
        content: string;
        sentAt: Date | null;
    }>;
    /**
     * Trigger ORDER_SHIPPED (Buyer)
     */
    notifyOrderShipped(userId: string, orderId: string, carrier: string, trackingNumber: string): Promise<{
        type: import(".prisma/client").$Enums.NotificationType;
        status: import(".prisma/client").$Enums.NotificationStatus;
        id: string;
        role: import(".prisma/client").$Enums.Role | null;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string | null;
        channel: import(".prisma/client").$Enums.NotificationChannel;
        subject: string | null;
        content: string;
        sentAt: Date | null;
    }>;
    /**
     * Trigger ORDER_DELIVERED (Buyer)
     */
    notifyOrderDelivered(userId: string, orderId: string): Promise<{
        type: import(".prisma/client").$Enums.NotificationType;
        status: import(".prisma/client").$Enums.NotificationStatus;
        id: string;
        role: import(".prisma/client").$Enums.Role | null;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string | null;
        channel: import(".prisma/client").$Enums.NotificationChannel;
        subject: string | null;
        content: string;
        sentAt: Date | null;
    }>;
    /**
     * Trigger SELLER_APPROVED (Seller)
     */
    notifySellerApproved(sellerId: string, email?: string | null): Promise<{
        type: import(".prisma/client").$Enums.NotificationType;
        status: import(".prisma/client").$Enums.NotificationStatus;
        id: string;
        role: import(".prisma/client").$Enums.Role | null;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string | null;
        channel: import(".prisma/client").$Enums.NotificationChannel;
        subject: string | null;
        content: string;
        sentAt: Date | null;
    }>;
    notifySellerProductApproved(sellerId: string, productTitle: string, email?: string | null): Promise<{
        type: import(".prisma/client").$Enums.NotificationType;
        status: import(".prisma/client").$Enums.NotificationStatus;
        id: string;
        role: import(".prisma/client").$Enums.Role | null;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string | null;
        channel: import(".prisma/client").$Enums.NotificationChannel;
        subject: string | null;
        content: string;
        sentAt: Date | null;
    }>;
    notifySellerProductRejected(sellerId: string, productTitle: string, reason: string, email?: string | null): Promise<{
        type: import(".prisma/client").$Enums.NotificationType;
        status: import(".prisma/client").$Enums.NotificationStatus;
        id: string;
        role: import(".prisma/client").$Enums.Role | null;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string | null;
        channel: import(".prisma/client").$Enums.NotificationChannel;
        subject: string | null;
        content: string;
        sentAt: Date | null;
    }>;
    /**
     * Trigger ADMIN_ALERT
     */
    notifyAdmin(title: string, message: string): Promise<{
        type: import(".prisma/client").$Enums.NotificationType;
        status: import(".prisma/client").$Enums.NotificationStatus;
        id: string;
        role: import(".prisma/client").$Enums.Role | null;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string | null;
        channel: import(".prisma/client").$Enums.NotificationChannel;
        subject: string | null;
        content: string;
        sentAt: Date | null;
    }>;
}
export declare const notificationService: NotificationService;
//# sourceMappingURL=notification.service.d.ts.map