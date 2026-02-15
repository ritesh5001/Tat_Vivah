import { CancellationStatus, NotificationChannel, NotificationType, OrderStatus, PaymentStatus, Role } from '@prisma/client';
import { prisma } from '../config/db.js';
import { cancellationLogger } from '../config/logger.js';
import {
    orderCancelApprovedTotal,
    orderCancelRejectedTotal,
    orderCancelTotal,
    orderCancelRequestTotal,
} from '../config/metrics.js';
import { ApiError } from '../errors/ApiError.js';
import { recordCancellationFatal } from '../monitoring/alerts.js';
import { notificationService } from '../notifications/notification.service.js';
import { paymentService } from './payment.service.js';

function isOrderCancellable(status: OrderStatus): boolean {
    return status === OrderStatus.PLACED || status === OrderStatus.CONFIRMED;
}

export class CancellationService {
    async requestCancellation(userId: string, orderId: string, reason: string) {
        const normalizedReason = reason.trim();
        if (!normalizedReason) {
            throw ApiError.badRequest('Cancellation reason is required');
        }

        const order = await prisma.order.findFirst({
            where: { id: orderId, userId },
            select: { id: true, userId: true, status: true },
        });

        if (!order) {
            throw ApiError.notFound('Order not found');
        }

        if (!isOrderCancellable(order.status)) {
            if (order.status === OrderStatus.SHIPPED || order.status === OrderStatus.DELIVERED) {
                recordCancellationFatal({
                    orderId,
                    userId,
                    reason: 'Cancellation attempted after shipment stage',
                });
            }
            throw ApiError.badRequest(`Order with status ${order.status} is not eligible for cancellation`);
        }

        const existing = await prisma.cancellationRequest.findUnique({
            where: { orderId },
            select: { id: true, status: true },
        });

        if (existing) {
            throw ApiError.conflict('Cancellation request already exists for this order', {
                cancellationId: existing.id,
                status: existing.status,
            });
        }

        const cancellation = await prisma.cancellationRequest.create({
            data: {
                orderId,
                userId,
                reason: normalizedReason,
                status: CancellationStatus.REQUESTED,
            },
            include: {
                order: { select: { id: true, userId: true, status: true } },
            },
        });

        await notificationService.notifyAdmin(
            'Cancellation request raised',
            `Buyer ${userId} requested cancellation for order ${orderId}`,
        );

        orderCancelRequestTotal.inc();
        orderCancelTotal.inc();
        cancellationLogger.info({ orderId, userId, cancellationId: cancellation.id }, 'cancellation_requested');

        return cancellation;
    }

    async getMyCancellations(userId: string) {
        const cancellations = await prisma.cancellationRequest.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                order: {
                    select: {
                        id: true,
                        status: true,
                        totalAmount: true,
                        createdAt: true,
                    },
                },
            },
        });

        return {
            cancellations,
        };
    }

    async approveCancellation(adminId: string, cancellationId: string) {
        const txResult = await prisma.$transaction(async (tx) => {
            const cancellation = await tx.cancellationRequest.findUnique({
                where: { id: cancellationId },
                include: {
                    order: {
                        select: {
                            id: true,
                            userId: true,
                            status: true,
                            payment: {
                                select: {
                                    id: true,
                                    status: true,
                                },
                            },
                            items: {
                                select: {
                                    id: true,
                                    sellerId: true,
                                    variantId: true,
                                    quantity: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!cancellation) {
                throw ApiError.notFound('Cancellation request not found');
            }

            if (!cancellation.order) {
                recordCancellationFatal({
                    cancellationId,
                    adminId,
                    reason: 'Order not found during cancellation approval',
                });
                throw ApiError.notFound('Order not found for cancellation request');
            }

            await tx.$queryRaw`SELECT id FROM "orders" WHERE id = ${cancellation.order.id} FOR UPDATE`;

            const lockedOrder = await tx.order.findUnique({
                where: { id: cancellation.order.id },
                select: {
                    id: true,
                    status: true,
                    userId: true,
                    payment: {
                        select: {
                            status: true,
                        },
                    },
                },
            });

            if (!lockedOrder) {
                recordCancellationFatal({
                    cancellationId,
                    orderId: cancellation.order.id,
                    adminId,
                    reason: 'Order not found after row lock during approval',
                });
                throw ApiError.notFound('Order not found');
            }

            if (lockedOrder.status === OrderStatus.SHIPPED || lockedOrder.status === OrderStatus.DELIVERED) {
                recordCancellationFatal({
                    cancellationId,
                    orderId: lockedOrder.id,
                    adminId,
                    userId: lockedOrder.userId,
                    reason: 'Cancellation attempted after shipped/delivered stage',
                });
                throw ApiError.badRequest(`Order with status ${lockedOrder.status} cannot be cancelled`);
            }

            if (cancellation.status === CancellationStatus.APPROVED || lockedOrder.status === OrderStatus.CANCELLED) {
                if (cancellation.status !== CancellationStatus.APPROVED) {
                    await tx.cancellationRequest.update({
                        where: { id: cancellation.id },
                        data: {
                            status: CancellationStatus.APPROVED,
                            reviewedBy: adminId,
                            reviewedAt: new Date(),
                        },
                    });
                }

                return {
                    orderId: lockedOrder.id,
                    userId: lockedOrder.userId,
                    sellerIds: [] as string[],
                    paymentStatus: lockedOrder.payment?.status ?? null,
                    alreadyCancelled: true,
                };
            }

            if (cancellation.status === CancellationStatus.REJECTED) {
                throw ApiError.conflict('Cannot approve a rejected cancellation request');
            }

            if (!isOrderCancellable(lockedOrder.status)) {
                throw ApiError.badRequest(`Order with status ${lockedOrder.status} is not eligible for cancellation`);
            }

            await tx.order.update({
                where: { id: lockedOrder.id },
                data: { status: OrderStatus.CANCELLED },
            });

            await tx.cancellationRequest.update({
                where: { id: cancellation.id },
                data: {
                    status: CancellationStatus.APPROVED,
                    reviewedBy: adminId,
                    reviewedAt: new Date(),
                },
            });

            const sellerIds = new Set<string>();
            for (const item of cancellation.order.items) {
                sellerIds.add(item.sellerId);

                const inventoryUpdate = await tx.inventory.updateMany({
                    where: { variantId: item.variantId },
                    data: { stock: { increment: item.quantity } },
                });

                if (inventoryUpdate.count === 0) {
                    recordCancellationFatal({
                        cancellationId,
                        orderId: lockedOrder.id,
                        adminId,
                        reason: `Inventory increment failed for variant ${item.variantId}`,
                    });
                    throw ApiError.internal(`Failed to restore inventory for variant ${item.variantId}`);
                }

                await tx.inventoryMovement.createMany({
                    data: [
                        {
                            variantId: item.variantId,
                            orderId: lockedOrder.id,
                            quantity: item.quantity,
                            type: 'RELEASE',
                        },
                    ],
                    skipDuplicates: true,
                });
            }

            return {
                orderId: lockedOrder.id,
                userId: lockedOrder.userId,
                sellerIds: Array.from(sellerIds),
                paymentStatus: lockedOrder.payment?.status ?? null,
                alreadyCancelled: false,
            };
        });

        let refundTriggered = false;
        if (txResult.paymentStatus === PaymentStatus.SUCCESS) {
            try {
                const refund = await paymentService.processRefund(txResult.orderId);
                refundTriggered = refund.refundTriggered;
            } catch (error) {
                recordCancellationFatal({
                    cancellationId,
                    orderId: txResult.orderId,
                    adminId,
                    userId: txResult.userId,
                    reason: 'Refund API failed during cancellation approval',
                });
                throw error;
            }
        }

        await notificationService.create({
            userId: txResult.userId,
            role: Role.USER,
            type: NotificationType.ADMIN_ALERT,
            channel: NotificationChannel.EMAIL,
            content: `Cancellation approved for order #${txResult.orderId}`,
            metadata: { orderId: txResult.orderId, status: 'APPROVED' },
            eventKey: `CANCELLATION_APPROVED:${txResult.orderId}`,
        });

        for (const sellerId of txResult.sellerIds) {
            await notificationService.create({
                userId: sellerId,
                role: Role.SELLER,
                type: NotificationType.ADMIN_ALERT,
                channel: NotificationChannel.EMAIL,
                content: `Order #${txResult.orderId} has been cancelled by admin approval`,
                metadata: { orderId: txResult.orderId, status: 'CANCELLED' },
                eventKey: `SELLER_ORDER_CANCELLED:${txResult.orderId}:${sellerId}`,
            });
        }

        orderCancelApprovedTotal.inc();
        cancellationLogger.info({
            orderId: txResult.orderId,
            userId: txResult.userId,
            adminId,
            paymentStatus: txResult.paymentStatus,
            refundTriggered,
            alreadyCancelled: txResult.alreadyCancelled,
        }, 'cancellation_approved');

        return {
            success: true,
            orderId: txResult.orderId,
            paymentStatus: txResult.paymentStatus,
            refundTriggered,
            alreadyCancelled: txResult.alreadyCancelled,
        };
    }

    async rejectCancellation(adminId: string, cancellationId: string, reason?: string) {
        const existing = await prisma.cancellationRequest.findUnique({
            where: { id: cancellationId },
            include: {
                order: {
                    select: {
                        id: true,
                        userId: true,
                    },
                },
            },
        });

        if (!existing) {
            throw ApiError.notFound('Cancellation request not found');
        }

        if (existing.status === CancellationStatus.APPROVED) {
            throw ApiError.conflict('Cannot reject an approved cancellation request');
        }

        if (existing.status === CancellationStatus.REJECTED) {
            return {
                success: true,
                cancellationId: existing.id,
                orderId: existing.orderId,
                alreadyRejected: true,
            };
        }

        const updated = await prisma.cancellationRequest.update({
            where: { id: cancellationId },
            data: {
                status: CancellationStatus.REJECTED,
                reviewedBy: adminId,
                reviewedAt: new Date(),
                rejectionReason: reason?.trim() || null,
            },
        });

        await notificationService.create({
            userId: existing.order.userId,
            role: Role.USER,
            type: NotificationType.ADMIN_ALERT,
            channel: NotificationChannel.EMAIL,
            content: `Cancellation rejected for order #${existing.order.id}`,
            metadata: {
                orderId: existing.order.id,
                status: 'REJECTED',
                reason: updated.rejectionReason,
            },
            eventKey: `CANCELLATION_REJECTED:${existing.order.id}`,
        });

        orderCancelRejectedTotal.inc();
        cancellationLogger.info({
            orderId: existing.order.id,
            userId: existing.order.userId,
            adminId,
            paymentStatus: null,
            refundTriggered: false,
        }, 'cancellation_rejected');

        return {
            success: true,
            cancellationId: updated.id,
            orderId: existing.order.id,
            alreadyRejected: false,
        };
    }
}

export const cancellationService = new CancellationService();
