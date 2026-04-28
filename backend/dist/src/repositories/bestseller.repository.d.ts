export declare class BestsellerRepository {
    listAdmin(): Promise<({
        product: {
            category: {
                name: string;
            };
            seller: {
                email: string | null;
            };
        } & {
            status: import(".prisma/client").$Enums.ProductStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            sellerId: string;
            categoryId: string;
            title: string;
            description: string | null;
            sellerPrice: import("@prisma/client/runtime/library").Decimal;
            adminListingPrice: import("@prisma/client/runtime/library").Decimal | null;
            priceApprovedAt: Date | null;
            priceApprovedById: string | null;
            rejectionReason: string | null;
            approvedAt: Date | null;
            approvedById: string | null;
            isPublished: boolean;
            deletedByAdmin: boolean;
            deletedByAdminAt: Date | null;
            deletedByAdminReason: string | null;
            taxRate: number;
            hsnCode: string | null;
            images: string[];
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        position: number;
    })[]>;
    listPublic(limit: number): Promise<({
        product: {
            category: {
                name: string;
            };
            variants: {
                status: import(".prisma/client").$Enums.ProductStatus;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                productId: string;
                sellerPrice: number;
                adminListingPrice: number | null;
                rejectionReason: string | null;
                approvedAt: Date | null;
                approvedById: string | null;
                images: string[];
                size: string;
                color: string | null;
                sku: string;
                price: number;
                compareAtPrice: number | null;
            }[];
        } & {
            status: import(".prisma/client").$Enums.ProductStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            sellerId: string;
            categoryId: string;
            title: string;
            description: string | null;
            sellerPrice: import("@prisma/client/runtime/library").Decimal;
            adminListingPrice: import("@prisma/client/runtime/library").Decimal | null;
            priceApprovedAt: Date | null;
            priceApprovedById: string | null;
            rejectionReason: string | null;
            approvedAt: Date | null;
            approvedById: string | null;
            isPublished: boolean;
            deletedByAdmin: boolean;
            deletedByAdminAt: Date | null;
            deletedByAdminReason: string | null;
            taxRate: number;
            hsnCode: string | null;
            images: string[];
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        position: number;
    })[]>;
    findByProductId(productId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        position: number;
    } | null>;
    create(productId: string, position: number): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        position: number;
    }>;
    update(id: string, position: number): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        position: number;
    }>;
    delete(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        position: number;
    }>;
    deleteByProductId(productId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getMaxPosition(): Promise<number>;
    countAll(): Promise<number>;
}
export declare const bestsellerRepository: BestsellerRepository;
//# sourceMappingURL=bestseller.repository.d.ts.map