/**
 * Admin Controller
 * HTTP handlers for admin panel endpoints
 */
import type { Request, Response, NextFunction } from 'express';
/**
 * Admin Controller
 * Handles HTTP requests for admin panel
 */
export declare const adminController: {
    /**
     * GET /v1/admin/stats
     * Lightweight counts + recent items for admin dashboard
     */
    getStats: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /v1/admin/sellers
     * List all sellers
     */
    listSellers: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * PUT /v1/admin/sellers/:id/approve
     * Approve a pending seller
     */
    approveSeller: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * PUT /v1/admin/sellers/:id/suspend
     * Suspend a seller
     */
    suspendSeller: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /v1/admin/products/pending
     * List products pending moderation
     */
    listPendingProducts: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /v1/admin/products
     * List all products
     */
    listAllProducts: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * PUT /v1/admin/products/:id/approve
     * Approve a product
     */
    approveProduct: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * PUT /v1/admin/products/:id/reject
     * Reject a product
     */
    rejectProduct: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * PATCH /v1/admin/products/:id/set-price
     * Set admin listing price for a product
     */
    setProductPrice: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /v1/admin/products/pricing-overview
     */
    pricingOverview: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /v1/admin/analytics/profit
     */
    profitAnalytics: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * DELETE /v1/admin/products/:id
     * Delete a product (soft delete)
     */
    deleteProduct: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /v1/admin/categories
     * List all categories (active + inactive)
     */
    listCategories: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * POST /v1/admin/categories
     * Create category
     */
    createCategory: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * PUT /v1/admin/categories/:id
     * Update category
     */
    updateCategory: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * DELETE /v1/admin/categories/:id
     * Deactivate category
     */
    deleteCategory: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /v1/admin/reviews
     * List all reviews
     */
    listReviews: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * DELETE /v1/admin/reviews/:id
     * Delete review
     */
    deleteReview: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /v1/admin/bestsellers
     */
    listBestsellers: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * POST /v1/admin/bestsellers
     */
    createBestseller: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * PUT /v1/admin/bestsellers/:id
     */
    updateBestseller: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * DELETE /v1/admin/bestsellers/:id
     */
    deleteBestseller: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /v1/admin/orders
     * List all orders
     */
    listOrders: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * PUT /v1/admin/orders/:id/cancel
     * Cancel an order
     */
    cancelOrder: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * PUT /v1/admin/orders/:id/force-confirm
     * Force confirm an order (SUPER_ADMIN only)
     */
    forceConfirmOrder: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /v1/admin/payments
     * List all payments
     */
    listPayments: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /v1/admin/settlements
     * List all settlements with optional filters
     */
    listSettlements: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /v1/admin/audit-logs
     * List audit logs with optional filters
     */
    listAuditLogs: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /v1/admin/refunds
     * List all refund ledger entries with optional filters
     */
    listRefunds(req: Request, res: Response, next: NextFunction): Promise<void>;
};
//# sourceMappingURL=admin.controller.d.ts.map