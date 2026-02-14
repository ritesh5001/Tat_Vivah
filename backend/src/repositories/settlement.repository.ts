
import { prisma } from '../config/db.js';
import { SellerSettlement, SettlementStatus } from '@prisma/client';

export class SettlementRepository {

    async createSettlement(data: {
        sellerId: string;
        orderItemId: string;
        amount: number;
        status: SettlementStatus;
    }): Promise<SellerSettlement> {
        return prisma.sellerSettlement.create({
            data
        });
    }

    async findSettlementsBySellerId(sellerId: string): Promise<SellerSettlement[]> {
        return prisma.sellerSettlement.findMany({
            where: { sellerId },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async markSettlementAsPaid(settlementId: string): Promise<SellerSettlement> {
        return prisma.sellerSettlement.update({
            where: { id: settlementId },
            data: {
                status: SettlementStatus.PAID
            }
        });
    }
}

export const settlementRepository = new SettlementRepository();
