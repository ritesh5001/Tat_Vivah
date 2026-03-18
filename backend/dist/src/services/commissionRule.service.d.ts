/**
 * Commission Rule Service
 * CRUD for commission rules with priority: seller > category > global
 */
import type { CreateCommissionRuleInput, UpdateCommissionRuleInput } from '../validators/commissionRule.validation.js';
export declare class CommissionRuleService {
    /**
     * List all commission rules with optional filters
     */
    listRules(filters?: {
        sellerId?: string;
        categoryId?: string;
        isActive?: boolean;
    }): Promise<{
        rules: ({
            category: {
                name: string;
                id: string;
            } | null;
            seller: {
                id: string;
                email: string | null;
                seller_profiles: {
                    store_name: string;
                } | null;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            sellerId: string | null;
            categoryId: string | null;
            commissionPercent: import("@prisma/client/runtime/library").Decimal;
            platformFee: import("@prisma/client/runtime/library").Decimal;
            isActive: boolean;
        })[];
    }>;
    /**
     * Create a new commission rule
     */
    createRule(input: CreateCommissionRuleInput): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sellerId: string | null;
        categoryId: string | null;
        commissionPercent: import("@prisma/client/runtime/library").Decimal;
        platformFee: import("@prisma/client/runtime/library").Decimal;
        isActive: boolean;
    }>;
    /**
     * Update a commission rule
     */
    updateRule(id: string, input: UpdateCommissionRuleInput): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sellerId: string | null;
        categoryId: string | null;
        commissionPercent: import("@prisma/client/runtime/library").Decimal;
        platformFee: import("@prisma/client/runtime/library").Decimal;
        isActive: boolean;
    }>;
    /**
     * Delete a commission rule (guard: cannot delete last active global rule)
     */
    deleteRule(id: string): Promise<void>;
}
export declare const commissionRuleService: CommissionRuleService;
//# sourceMappingURL=commissionRule.service.d.ts.map