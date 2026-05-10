import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { siteStatusController, siteMaintenanceSecretController } from '../controllers/site-status.controller.js';

/**
 * Site status routes
 * - Public read endpoint
 * - Admin-only toggle endpoint
 * - Secret query-param toggle endpoint (for quick site lock/unlock)
 */
const siteStatusRouter = Router();

siteStatusRouter.get('/', siteStatusController.getStatus);
siteStatusRouter.patch(
  '/',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  siteStatusController.updateStatus
);

// Secret endpoints (body-based, not query params)
siteStatusRouter.post('/secret/verify', siteMaintenanceSecretController.verify);
siteStatusRouter.post('/secret/toggle', siteMaintenanceSecretController.toggle);

export { siteStatusRouter };
