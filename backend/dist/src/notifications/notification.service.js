import { notificationRepository } from './notification.repository.js';
import { notificationQueue } from './notification.queue.js';
export class NotificationService {
    /**
     * Core method to create notification and add to queue
     */
    async create(data) {
        // 1. Persist to DB (Status: PENDING)
        const notification = await notificationRepository.create(data);
        // 2. Add to BullMQ
        await notificationQueue.add(data.type, {
            notificationId: notification.id
        });
        return notification;
    }
    /**
     * Trigger ORDER_PLACED (Buyer)
     */
    async notifyOrderPlaced(userId, orderId, totalAmount) {
        return this.create({
            userId,
            role: 'USER',
            type: 'ORDER_PLACED',
            channel: 'EMAIL',
            content: `Order #${orderId} Placed`,
            metadata: { orderId, totalAmount }
        });
    }
    /**
     * Trigger SELLER_NEW_ORDER (Seller)
     */
    async notifySellerNewOrder(sellerId, orderId, itemsCount) {
        return this.create({
            userId: sellerId,
            role: 'SELLER',
            type: 'SELLER_NEW_ORDER',
            channel: 'EMAIL',
            content: `New Order #${orderId}`,
            metadata: { orderId, itemsCount }
        });
    }
    /**
     * Trigger ORDER_SHIPPED (Buyer)
     */
    async notifyOrderShipped(userId, orderId, carrier, trackingNumber) {
        return this.create({
            userId,
            role: 'USER',
            type: 'ORDER_SHIPPED',
            channel: 'EMAIL',
            content: `Order #${orderId} Shipped`,
            metadata: { orderId, carrier, trackingNumber }
        });
    }
    /**
     * Trigger ORDER_DELIVERED (Buyer)
     */
    async notifyOrderDelivered(userId, orderId) {
        return this.create({
            userId,
            role: 'USER',
            type: 'ORDER_DELIVERED',
            channel: 'EMAIL',
            content: `Order #${orderId} Delivered`,
            metadata: { orderId }
        });
    }
    /**
     * Trigger SELLER_APPROVED (Seller)
     */
    async notifySellerApproved(sellerId, email) {
        return this.create({
            userId: sellerId,
            role: 'SELLER',
            type: 'SELLER_APPROVED',
            channel: 'EMAIL',
            content: 'Your seller account is approved',
            metadata: { sellerEmail: email }
        });
    }
    async notifySellerProductApproved(sellerId, productTitle, email) {
        return this.create({
            userId: sellerId,
            role: 'SELLER',
            type: 'SELLER_PRODUCT_APPROVED',
            channel: 'EMAIL',
            content: `Your product '${productTitle}' has been approved.`,
            metadata: { productTitle, email }
        });
    }
    async notifySellerProductRejected(sellerId, productTitle, reason, email) {
        return this.create({
            userId: sellerId,
            role: 'SELLER',
            type: 'SELLER_PRODUCT_REJECTED',
            channel: 'EMAIL',
            content: `Your product was rejected. Reason: ${reason}`,
            metadata: { productTitle, reason, email }
        });
    }
    /**
     * Trigger ADMIN_ALERT
     */
    async notifyAdmin(title, message) {
        // Note: userId is null for generic admin alert usually, 
        // or we need a specific admin ID. 
        // For now, we'll set userId null and expect metadata email strictly?
        // OR we don't send email if no user? 
        // Let's assume metadata has target email or we broadcast.
        // For simplicity: We create generic alert. Worker might fail if no email.
        // We will fallback to logging.
        return this.create({
            userId: null,
            role: 'ADMIN',
            type: 'ADMIN_ALERT',
            channel: 'EMAIL',
            content: title,
            metadata: { title, message } // Requires email in metadata in real world or specialized worker logic
        });
    }
}
export const notificationService = new NotificationService();
//# sourceMappingURL=notification.service.js.map