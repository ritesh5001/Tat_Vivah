/**
 * User Notification Controller
 *
 * Endpoints for authenticated users (buyers/sellers) to manage their notifications.
 * - GET  /v1/notifications           — paginated list
 * - GET  /v1/notifications/unread-count — badge count
 * - PATCH /v1/notifications/:id/read  — mark single notification as read
 */
import { notificationRepository } from '../notifications/notification.repository.js';
export class NotificationController {
    /**
     * GET /v1/notifications?page=1&limit=20
     * Returns paginated notifications for the authenticated user.
     */
    async listNotifications(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
            const result = await notificationRepository.findByUserId(userId, page, limit);
            // Map to client-friendly format
            const data = result.notifications.map((n) => {
                const meta = n.metadata ?? {};
                return {
                    id: n.id,
                    type: n.type,
                    title: n.subject ?? n.content,
                    message: n.content,
                    isRead: n.isRead,
                    createdAt: n.createdAt.toISOString(),
                    meta: {
                        orderId: meta.orderId ?? undefined,
                        ...meta,
                    },
                };
            });
            res.status(200).json({
                success: true,
                data,
                meta: {
                    total: result.total,
                    page,
                    limit,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /v1/notifications/unread-count
     * Returns the count of unread notifications for badge display.
     */
    async getUnreadCount(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const count = await notificationRepository.countUnread(userId);
            res.status(200).json({
                success: true,
                data: { count },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PATCH /v1/notifications/:id/read
     * Marks a single notification as read for the authenticated user.
     */
    async markAsRead(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const { id } = req.params;
            const notification = await notificationRepository.markAsRead(id, userId);
            if (!notification) {
                res.status(404).json({ success: false, message: 'Notification not found' });
                return;
            }
            res.status(200).json({
                success: true,
                data: {
                    id: notification.id,
                    isRead: notification.isRead,
                    readAt: notification.readAt?.toISOString() ?? null,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
export const notificationController = new NotificationController();
//# sourceMappingURL=notification.controller.js.map