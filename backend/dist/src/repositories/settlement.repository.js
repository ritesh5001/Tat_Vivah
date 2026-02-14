import { prisma } from '../config/db.js';
import { SettlementStatus } from '@prisma/client';
export class SettlementRepository {
    async createSettlement(data) {
        return prisma.sellerSettlement.create({
            data
        });
    }
    async findSettlementsBySellerId(sellerId) {
        return prisma.sellerSettlement.findMany({
            where: { sellerId },
            include: {
                orderItem: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
    async markSettlementAsPaid(settlementId) {
        return prisma.sellerSettlement.update({
            where: { id: settlementId },
            data: {
                status: SettlementStatus.PAID
            }
        });
    }
}
export const settlementRepository = new SettlementRepository();
//# sourceMappingURL=settlement.repository.js.map