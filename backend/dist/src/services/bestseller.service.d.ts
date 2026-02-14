export declare class BestsellerService {
    listPublic(limit?: number): Promise<any>;
    listAdmin(): Promise<{
        bestsellers: {
            id: string;
            productId: string;
            position: number;
            title: string;
            categoryName: string;
            sellerEmail: string | null;
            isPublished: boolean;
            deletedByAdmin: boolean;
            image: string | null;
        }[];
    }>;
    add(productId: string, position?: number): Promise<{
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
    remove(id: string): Promise<void>;
    removeByProductId(productId: string): Promise<void>;
}
export declare const bestsellerService: BestsellerService;
//# sourceMappingURL=bestseller.service.d.ts.map