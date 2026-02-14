import { prisma } from '../config/db.js';
export class PaymentRepository {
    async createPayment(data) {
        return prisma.payment.create({
            data
        });
    }
    async findPaymentByOrderId(orderId) {
        return prisma.payment.findUnique({
            where: { orderId },
            include: {
                events: true
            }
        });
    }
    async findPaymentById(paymentId) {
        return prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                events: true,
                order: true
            }
        });
    }
    async findByProviderOrderId(providerOrderId) {
        return prisma.payment.findFirst({
            where: { providerOrderId },
            include: {
                events: true,
                order: {
                    include: {
                        items: true
                    }
                }
            }
        });
    }
    async updatePaymentStatus(paymentId, status, providerPaymentId) {
        const data = { status };
        if (providerPaymentId) {
            data.providerPaymentId = providerPaymentId;
        }
        return prisma.payment.update({
            where: { id: paymentId },
            data
        });
    }
    async updateProviderOrderId(paymentId, providerOrderId) {
        return prisma.payment.update({
            where: { id: paymentId },
            data: { providerOrderId }
        });
    }
    async updatePaymentWithSignature(paymentId, status, providerPaymentId, providerSignature) {
        const data = { status, providerPaymentId };
        if (providerSignature) {
            data.providerSignature = providerSignature;
        }
        return prisma.payment.update({
            where: { id: paymentId },
            data
        });
    }
    async createPaymentEvent(data) {
        return prisma.paymentEvent.create({
            data: {
                paymentId: data.paymentId,
                type: data.type,
                payload: data.payload || {}
            }
        });
    }
}
export const paymentRepository = new PaymentRepository();
//# sourceMappingURL=payment.repository.js.map