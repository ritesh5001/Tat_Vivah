/**
 * Admin Controller
 * HTTP handlers for admin panel endpoints
 */

import type { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service.js';
import { categoryService } from '../services/category.service.js';
import { reviewService } from '../services/review.service.js';
import { createCategorySchema, updateCategorySchema } from '../validators/category.validation.js';
import { auditService } from '../services/audit.service.js';
import type { AuditLogFilters, AuditEntityType } from '../repositories/audit.repository.js';
import { ApiError } from '../errors/ApiError.js';
import { bestsellerService } from '../services/bestseller.service.js';
import { createBestsellerSchema, updateBestsellerSchema } from '../validators/bestseller.validation.js';
import { productIdParamSchema, productRejectSchema } from '../validators/admin.validation.js';

/**
 * Admin Controller
 * Handles HTTP requests for admin panel
 */
export const adminController = {
    // =========================================================================
    // SELLER MANAGEMENT
    // =========================================================================

    /**
     * GET /v1/admin/sellers
     * List all sellers
     */
    listSellers: async (
        _req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const result = await adminService.listSellers();
            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * PUT /v1/admin/sellers/:id/approve
     * Approve a pending seller
     */
    approveSeller: async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const id = req.params['id'] as string;
            const actorId = req.user!.userId as string;
            const result = await adminService.approveSeller(id, actorId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * PUT /v1/admin/sellers/:id/suspend
     * Suspend a seller
     */
    suspendSeller: async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const id = req.params['id'] as string;
            const actorId = req.user!.userId as string;
            const result = await adminService.suspendSeller(id, actorId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    // =========================================================================
    // PRODUCT MODERATION
    // =========================================================================

    /**
     * GET /v1/admin/products/pending
     * List products pending moderation
     */
    listPendingProducts: async (
        _req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const result = await adminService.listPendingProducts();
            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /v1/admin/products
     * List all products
     */
    listAllProducts: async (
        _req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const result = await adminService.listAllProducts();
            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * PUT /v1/admin/products/:id/approve
     * Approve a product
     */
    approveProduct: async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = productIdParamSchema.parse(req.params);
            const actorId = req.user!.userId as string;
            const result = await adminService.approveProduct(id, actorId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * PUT /v1/admin/products/:id/reject
     * Reject a product
     */
    rejectProduct: async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { id } = productIdParamSchema.parse(req.params);
            const { reason } = productRejectSchema.parse(req.body);
            const actorId = req.user!.userId as string;
            const result = await adminService.rejectProduct(id, reason, actorId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * DELETE /v1/admin/products/:id
     * Delete a product (soft delete)
     */
    deleteProduct: async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const id = req.params['id'] as string;
            const actorId = req.user!.userId as string;
            const { reason } = req.body as { reason?: string };
            const result = await adminService.deleteProduct(id, actorId, reason);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    // =========================================================================
    // CATEGORY MANAGEMENT
    // =========================================================================

    /**
     * GET /v1/admin/categories
     * List all categories (active + inactive)
     */
    listCategories: async (
        _req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const result = await categoryService.listAllCategories();
            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /v1/admin/categories
     * Create category
     */
    createCategory: async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const validated = createCategorySchema.parse(req.body);
            const category = await categoryService.createCategory(validated.name);
            res.status(201).json({ message: 'Category created', category });
        } catch (error) {
            next(error);
        }
    },

    /**
     * PUT /v1/admin/categories/:id
     * Update category
     */
    updateCategory: async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const id = req.params['id'] as string;
            const validated = updateCategorySchema.parse(req.body);
            if (validated.name === undefined && validated.isActive === undefined) {
                throw ApiError.badRequest('No updates provided');
            }
            const category = await categoryService.updateCategory(id, validated);
            res.json({ message: 'Category updated', category });
        } catch (error) {
            next(error);
        }
    },

    /**
     * DELETE /v1/admin/categories/:id
     * Deactivate category
     */
    deleteCategory: async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const id = req.params['id'] as string;
            const category = await categoryService.deactivateCategory(id);
            res.json({ message: 'Category deactivated', category });
        } catch (error) {
            next(error);
        }
    },

    // =========================================================================
    // REVIEW MANAGEMENT
    // =========================================================================

    /**
     * GET /v1/admin/reviews
     * List all reviews
     */
    listReviews: async (
        _req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const result = await reviewService.listReviews();
            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * DELETE /v1/admin/reviews/:id
     * Delete review
     */
    deleteReview: async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const id = req.params['id'] as string;
            await reviewService.deleteReview(id);
            res.json({ message: 'Review deleted' });
        } catch (error) {
            next(error);
        }
    },

    // =========================================================================
    // BESTSELLER MANAGEMENT
    // =========================================================================

    /**
     * GET /v1/admin/bestsellers
     */
    listBestsellers: async (
        _req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const result = await bestsellerService.listAdmin();
            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /v1/admin/bestsellers
     */
    createBestseller: async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const validated = createBestsellerSchema.parse(req.body);
            const created = await bestsellerService.add(validated.productId, validated.position);
            res.status(201).json({ message: 'Bestseller added', bestseller: created });
        } catch (error) {
            next(error);
        }
    },

    /**
     * PUT /v1/admin/bestsellers/:id
     */
    updateBestseller: async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const id = req.params['id'] as string;
            const validated = updateBestsellerSchema.parse(req.body);
            const updated = await bestsellerService.update(id, validated.position);
            res.json({ message: 'Bestseller updated', bestseller: updated });
        } catch (error) {
            next(error);
        }
    },

    /**
     * DELETE /v1/admin/bestsellers/:id
     */
    deleteBestseller: async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const id = req.params['id'] as string;
            await bestsellerService.remove(id);
            res.json({ message: 'Bestseller removed' });
        } catch (error) {
            next(error);
        }
    },

    // =========================================================================
    // ORDER MANAGEMENT
    // =========================================================================

    /**
     * GET /v1/admin/orders
     * List all orders
     */
    listOrders: async (
        _req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const result = await adminService.listOrders();
            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * PUT /v1/admin/orders/:id/cancel
     * Cancel an order
     */
    cancelOrder: async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const id = req.params['id'] as string;
            const actorId = req.user!.userId as string;
            const result = await adminService.cancelOrder(id, actorId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * PUT /v1/admin/orders/:id/force-confirm
     * Force confirm an order (SUPER_ADMIN only)
     */
    forceConfirmOrder: async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const id = req.params['id'] as string;
            const actorId = req.user!.userId as string;
            const result = await adminService.forceConfirmOrder(id, actorId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    // =========================================================================
    // PAYMENTS & SETTLEMENTS
    // =========================================================================

    /**
     * GET /v1/admin/payments
     * List all payments
     */
    listPayments: async (
        _req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const result = await adminService.listPayments();
            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /v1/admin/settlements
     * List all settlements
     */
    listSettlements: async (
        _req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const result = await adminService.listSettlements();
            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    // =========================================================================
    // AUDIT LOGS
    // =========================================================================

    /**
     * GET /v1/admin/audit-logs
     * List audit logs with optional filters
     */
    listAuditLogs: async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { entityType, entityId, actorId, startDate, endDate } = req.query;

            const filters: AuditLogFilters = {};

            if (entityType && typeof entityType === 'string') {
                filters.entityType = entityType as AuditEntityType;
            }
            if (entityId && typeof entityId === 'string') {
                filters.entityId = entityId;
            }
            if (actorId && typeof actorId === 'string') {
                filters.actorId = actorId;
            }
            if (startDate && typeof startDate === 'string') {
                filters.startDate = new Date(startDate);
            }
            if (endDate && typeof endDate === 'string') {
                filters.endDate = new Date(endDate);
            }

            const result = await auditService.getAuditLogs(filters);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },
};
