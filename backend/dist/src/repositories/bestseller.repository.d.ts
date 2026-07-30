export declare class BestsellerRepository {
    listAdmin(): Promise<({
        product: {
            category: {
                name: string;
            };
            seller: {
                email: string | null;
            };
        } & import("@prisma/client/runtime/index.js").GetResult<{
            id: string;
            sellerId: string;
            categoryId: string;
            audience: import(".prisma/client").ProductAudience;
            title: string;
            description: string | null;
            sellerPrice: import("@prisma/client/runtime/index.js").Decimal;
            adminListingPrice: import("@prisma/client/runtime/index.js").Decimal | null;
            priceApprovedAt: Date | null;
            priceApprovedById: string | null;
            status: import(".prisma/client").ProductStatus;
            rejectionReason: string | null;
            approvedAt: Date | null;
            approvedById: string | null;
            isPublished: boolean;
            deletedByAdmin: boolean;
            deletedByAdminAt: Date | null;
            deletedByAdminReason: string | null;
            createdAt: Date;
            updatedAt: Date;
            taxRate: number;
            hsnCode: string | null;
            images: string[];
        }, unknown> & {};
    } & import("@prisma/client/runtime/index.js").GetResult<{
        id: string;
        productId: string;
        position: number;
        createdAt: Date;
        updatedAt: Date;
    }, unknown> & {})[]>;
    listPublic(limit: number, audience?: 'MENS' | 'KIDS'): Promise<({
        product: {
            variants: (import("@prisma/client/runtime/index.js").GetResult<{
                id: string;
                productId: string;
                size: string;
                color: string | null;
                images: string[];
                sku: string;
                sellerPrice: number;
                adminListingPrice: number | null;
                price: number;
                compareAtPrice: number | null;
                status: import(".prisma/client").ProductStatus;
                rejectionReason: string | null;
                approvedAt: Date | null;
                approvedById: string | null;
                createdAt: Date;
                updatedAt: Date;
            }, unknown> & {})[];
            category: {
                name: string;
            };
        } & import("@prisma/client/runtime/index.js").GetResult<{
            id: string;
            sellerId: string;
            categoryId: string;
            audience: import(".prisma/client").ProductAudience;
            title: string;
            description: string | null;
            sellerPrice: import("@prisma/client/runtime/index.js").Decimal;
            adminListingPrice: import("@prisma/client/runtime/index.js").Decimal | null;
            priceApprovedAt: Date | null;
            priceApprovedById: string | null;
            status: import(".prisma/client").ProductStatus;
            rejectionReason: string | null;
            approvedAt: Date | null;
            approvedById: string | null;
            isPublished: boolean;
            deletedByAdmin: boolean;
            deletedByAdminAt: Date | null;
            deletedByAdminReason: string | null;
            createdAt: Date;
            updatedAt: Date;
            taxRate: number;
            hsnCode: string | null;
            images: string[];
        }, unknown> & {};
    } & import("@prisma/client/runtime/index.js").GetResult<{
        id: string;
        productId: string;
        position: number;
        createdAt: Date;
        updatedAt: Date;
    }, unknown> & {})[]>;
    findByProductId(productId: string): Promise<(import("@prisma/client/runtime/index.js").GetResult<{
        id: string;
        productId: string;
        position: number;
        createdAt: Date;
        updatedAt: Date;
    }, unknown> & {}) | null>;
    create(productId: string, position: number): Promise<import("@prisma/client/runtime/index.js").GetResult<{
        id: string;
        productId: string;
        position: number;
        createdAt: Date;
        updatedAt: Date;
    }, unknown> & {}>;
    update(id: string, position: number): Promise<import("@prisma/client/runtime/index.js").GetResult<{
        id: string;
        productId: string;
        position: number;
        createdAt: Date;
        updatedAt: Date;
    }, unknown> & {}>;
    delete(id: string): Promise<import("@prisma/client/runtime/index.js").GetResult<{
        id: string;
        productId: string;
        position: number;
        createdAt: Date;
        updatedAt: Date;
    }, unknown> & {}>;
    deleteByProductId(productId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getMaxPosition(): Promise<number>;
    countAll(): Promise<number>;
}
export declare const bestsellerRepository: BestsellerRepository;
//# sourceMappingURL=bestseller.repository.d.ts.map