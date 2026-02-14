import { Router } from 'express';
import { webhookController } from '../controllers/webhook.controller.js';
const router = Router();
// Webhooks are public (verified by signature)
router.post('/:provider', webhookController.handleWebhook);
export const webhookRoutes = router;
//# sourceMappingURL=webhook.routes.js.map