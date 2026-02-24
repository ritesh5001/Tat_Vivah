/**
 * Coupon Admin Service
 * CRUD operations for admin coupon management
 * Separate from CouponService which handles apply/redeem/validate at checkout
 */
import { Prisma } from '@prisma/client';
import type { CreateCouponInput, UpdateCouponInput } from '../validators/couponAdmin.validation.js';
export declare class CouponAdminService {
    /**
     * List coupons with pagination and optional filters
     */
    listCoupons(query: {
        page: number;
        limit: number;
        isActive?: string | undefined;
        type?: string | undefined;
        search?: string | undefined;
    }): Promise<{
        coupons: ({
            _count: {
                redemptions: number;
            };
            seller: {
                id: string;
                email: string | null;
                seller_profiles: {
                    store_name: string;
                } | null;
            } | null;
        } & {
            value: Prisma.Decimal;
            code: string;
            type: import(".prisma/client").$Enums.CouponType;
            id: string;
            createdAt: Date;
            sellerId: string | null;
            isActive: boolean;
            maxDiscountAmount: Prisma.Decimal | null;
            minOrderAmount: Prisma.Decimal;
            usageLimit: number | null;
            perUserLimit: number | null;
            usedCount: number;
            validFrom: Date;
            validUntil: Date;
            firstTimeUserOnly: boolean;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    /**
     * Create a new coupon
     */
    createCoupon(input: CreateCouponInput): Promise<{
        seller: {
            id: string;
            email: string | null;
            seller_profiles: {
                store_name: string;
            } | null;
        } | null;
    } & {
        value: Prisma.Decimal;
        code: string;
        type: import(".prisma/client").$Enums.CouponType;
        id: string;
        createdAt: Date;
        sellerId: string | null;
        isActive: boolean;
        maxDiscountAmount: Prisma.Decimal | null;
        minOrderAmount: Prisma.Decimal;
        usageLimit: number | null;
        perUserLimit: number | null;
        usedCount: number;
        validFrom: Date;
        validUntil: Date;
        firstTimeUserOnly: boolean;
    }>;
    /**
     * Update an existing coupon
     */
    updateCoupon(id: string, input: UpdateCouponInput): Promise<{
        seller: {
            id: string;
            email: string | null;
            seller_profiles: {
                store_name: string;
            } | null;
        } | null;
    } & {
        value: Prisma.Decimal;
        code: string;
        type: import(".prisma/client").$Enums.CouponType;
        id: string;
        createdAt: Date;
        sellerId: string | null;
        isActive: boolean;
        maxDiscountAmount: Prisma.Decimal | null;
        minOrderAmount: Prisma.Decimal;
        usageLimit: number | null;
        perUserLimit: number | null;
        usedCount: number;
        validFrom: Date;
        validUntil: Date;
        firstTimeUserOnly: boolean;
    }>;
    /**
     * Delete a coupon (only if it has zero redemptions)
     */
    deleteCoupon(id: string): Promise<void>;
    /**
     * Toggle coupon active state
     */
    toggleCoupon(id: string): Promise<{
        value: Prisma.Decimal;
        code: string;
        type: import(".prisma/client").$Enums.CouponType;
        id: string;
        createdAt: Date;
        sellerId: string | null;
        isActive: boolean;
        maxDiscountAmount: Prisma.Decimal | null;
        minOrderAmount: Prisma.Decimal;
        usageLimit: number | null;
        perUserLimit: number | null;
        usedCount: number;
        validFrom: Date;
        validUntil: Date;
        firstTimeUserOnly: boolean;
    }>;
}
export declare const couponAdminService: CouponAdminService;
//# sourceMappingURL=couponAdmin.service.d.ts.map