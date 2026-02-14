import { SellerSettlement, SettlementStatus } from '@prisma/client';
export declare class SettlementRepository {
    createSettlement(data: {
        sellerId: string;
        orderItemId: string;
        amount: number;
        status: SettlementStatus;
    }): Promise<SellerSettlement>;
    findSettlementsBySellerId(sellerId: string): Promise<SellerSettlement[]>;
    markSettlementAsPaid(settlementId: string): Promise<SellerSettlement>;
}
export declare const settlementRepository: SettlementRepository;
//# sourceMappingURL=settlement.repository.d.ts.map