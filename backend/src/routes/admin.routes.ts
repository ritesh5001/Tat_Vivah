/**
 * Admin Routes
 * Routes for admin panel endpoints with role-based access control
 */

import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { adminController } from '../controllers/admin.controller.js';

export const adminRouter = Router();

// ============================================================================
// All routes require authentication
// ============================================================================
adminRouter.use(authenticate);

// ============================================================================
// SELLER MANAGEMENT (ADMIN + SUPER_ADMIN)
// ============================================================================

/**
 * GET /v1/admin/sellers
 * List all sellers
 */
adminRouter.get(
    '/sellers',
    authorize('ADMIN', 'SUPER_ADMIN'),
    adminController.listSellers
);

/**
 * PUT /v1/admin/sellers/:id/approve
 * Approve a pending seller
 */
adminRouter.put(
    '/sellers/:id/approve',
    authorize('ADMIN', 'SUPER_ADMIN'),
    adminController.approveSeller
);

/**
 * PUT /v1/admin/sellers/:id/suspend
 * Suspend a seller
 */
adminRouter.put(
    '/sellers/:id/suspend',
    authorize('ADMIN', 'SUPER_ADMIN'),
    adminController.suspendSeller
);

/**
 * GET /v1/admin/products
 * List all products
 */
adminRouter.get(
    '/products',
    authorize('ADMIN', 'SUPER_ADMIN'),
    adminController.listAllProducts
);

/**
 * GET /v1/admin/products/pending
 * List products pending approval
 */
adminRouter.get(
    '/products/pending',
    authorize('ADMIN', 'SUPER_ADMIN'),
    adminController.listPendingProducts
);

/**
 * PATCH /v1/admin/products/:id/approve
 * Approve a pending product
 */
adminRouter.patch(
    '/products/:id/approve',
    authorize('ADMIN', 'SUPER_ADMIN'),
    adminController.approveProduct
);

/**
 * PATCH /v1/admin/products/:id/reject
 * Reject a pending product
 */
adminRouter.patch(
    '/products/:id/reject',
    authorize('ADMIN', 'SUPER_ADMIN'),
    adminController.rejectProduct
);

// Backward-compatible aliases
adminRouter.put(
    '/products/:id/approve',
    authorize('ADMIN', 'SUPER_ADMIN'),
    adminController.approveProduct
);

adminRouter.put(
    '/products/:id/reject',
    authorize('ADMIN', 'SUPER_ADMIN'),
    adminController.rejectProduct
);

/**
 * DELETE /v1/admin/products/:id
 * Delete a product (soft delete)
 */
adminRouter.delete(
    '/products/:id',
    authorize('ADMIN', 'SUPER_ADMIN'),
    adminController.deleteProduct
);

// ============================================================================
// CATEGORY MANAGEMENT (ADMIN + SUPER_ADMIN)
// ============================================================================

/**
 * GET /v1/admin/categories
 * List all categories
 */
adminRouter.get(
    '/categories',
    authorize('ADMIN', 'SUPER_ADMIN'),
    adminController.listCategories
);

/**
 * POST /v1/admin/categories
 * Create category
 */
adminRouter.post(
    '/categories',
    authorize('ADMIN', 'SUPER_ADMIN'),
    adminController.createCategory
);

/**
 * PUT /v1/admin/categories/:id
 * Update category
 */
adminRouter.put(
    '/categories/:id',
    authorize('ADMIN', 'SUPER_ADMIN'),
    adminController.updateCategory
);

/**
 * DELETE /v1/admin/categories/:id
 * Deactivate category
 */
adminRouter.delete(
    '/categories/:id',
    authorize('ADMIN', 'SUPER_ADMIN'),
    adminController.deleteCategory
);

// ============================================================================
// BESTSELLER MANAGEMENT (ADMIN + SUPER_ADMIN)
// ============================================================================

/**
 * GET /v1/admin/bestsellers
 * List all bestsellers (admin view)
 */
adminRouter.get(
    '/bestsellers',
    authorize('ADMIN', 'SUPER_ADMIN'),
    adminController.listBestsellers
);

/**
 * POST /v1/admin/bestsellers
 * Create a bestseller entry
 */
adminRouter.post(
    '/bestsellers',
    authorize('ADMIN', 'SUPER_ADMIN'),
    adminController.createBestseller
);

/**
 * PUT /v1/admin/bestsellers/:id
 * Update a bestseller entry
 */
adminRouter.put(
    '/bestsellers/:id',
    authorize('ADMIN', 'SUPER_ADMIN'),
    adminController.updateBestseller
);

/**
 * DELETE /v1/admin/bestsellers/:id
 * Delete a bestseller entry
 */
adminRouter.delete(
    '/bestsellers/:id',
    authorize('ADMIN', 'SUPER_ADMIN'),
    adminController.deleteBestseller
);

// ============================================================================
// REVIEWS MANAGEMENT (ADMIN + SUPER_ADMIN)
// ============================================================================

/**
 * GET /v1/admin/reviews
 * List all reviews
 */
adminRouter.get(
    '/reviews',
    authorize('ADMIN', 'SUPER_ADMIN'),
    adminController.listReviews
);

/**
 * DELETE /v1/admin/reviews/:id
 * Delete review
 */
adminRouter.delete(
    '/reviews/:id',
    authorize('ADMIN', 'SUPER_ADMIN'),
    adminController.deleteReview
);

// ============================================================================
// ORDER MANAGEMENT
// ============================================================================

/**
 * GET /v1/admin/orders
 * List all orders
 */
adminRouter.get(
    '/orders',
    authorize('ADMIN', 'SUPER_ADMIN'),
    adminController.listOrders
);

/**
 * PUT /v1/admin/orders/:id/cancel
 * Cancel an order (ADMIN + SUPER_ADMIN)
 */
adminRouter.put(
    '/orders/:id/cancel',
    authorize('ADMIN', 'SUPER_ADMIN'),
    adminController.cancelOrder
);

/**
 * PUT /v1/admin/orders/:id/force-confirm
 * Force confirm an order - SUPER_ADMIN ONLY
 * This bypasses payment verification
 */
adminRouter.put(
    '/orders/:id/force-confirm',
    authorize('SUPER_ADMIN'),
    adminController.forceConfirmOrder
);

// ============================================================================
// PAYMENTS & SETTLEMENTS (READ-ONLY)
// ============================================================================

/**
 * GET /v1/admin/payments
 * List all payments
 */
adminRouter.get(
    '/payments',
    authorize('ADMIN', 'SUPER_ADMIN'),
    adminController.listPayments
);

/**
 * GET /v1/admin/settlements
 * List all settlements
 */
adminRouter.get(
    '/settlements',
    authorize('ADMIN', 'SUPER_ADMIN'),
    adminController.listSettlements
);

// ============================================================================
// AUDIT LOGS
// ============================================================================

/**
 * GET /v1/admin/audit-logs
 * List audit logs with optional filters
 */
adminRouter.get(
    '/audit-logs',
    authorize('ADMIN', 'SUPER_ADMIN'),
    adminController.listAuditLogs
);
