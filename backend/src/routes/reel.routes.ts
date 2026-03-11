import { Router } from 'express';
import { reelController } from '../controllers/reel.controller.js';

/**
 * Public Reel Routes
 * Base path: /v1/reels
 * All routes are PUBLIC (no auth required)
 */
const reelRouter = Router();

/**
 * GET /v1/reels
 * List approved reels with pagination
 */
reelRouter.get('/', reelController.listPublicReels);

/**
 * GET /v1/reels/:id
 * Get a single approved reel by ID
 */
reelRouter.get('/:id', reelController.getPublicReel);

export { reelRouter };
