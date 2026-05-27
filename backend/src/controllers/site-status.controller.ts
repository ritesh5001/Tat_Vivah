import type { NextFunction, Request, Response } from 'express';
import { z, ZodError } from 'zod';
import { ApiError } from '../errors/ApiError.js';
import {
  getSiteMaintenanceState,
  setSiteMaintenanceState,
} from '../services/site-maintenance.service.js';

// Hardcoded maintenance secret (Kingbhai786#)
const MAINTENANCE_SECRET = 'Kingbhai786#';

const maintenanceUpdateSchema = z.object({
  maintenanceEnabled: z.boolean(),
  maintenanceMessage: z
    .string()
    .trim()
    .min(1, 'Maintenance message cannot be empty')
    .max(240, 'Maintenance message is too long')
    .optional(),
});

export class SiteStatusController {
  getStatus = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const state = await getSiteMaintenanceState();

      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.status(200).json({
        success: true,
        siteLocked: state.maintenanceEnabled,
        maintenanceEnabled: state.maintenanceEnabled,
        maintenanceMessage: state.maintenanceMessage,
        updatedAt: state.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = maintenanceUpdateSchema.parse(req.body);
      const state = await setSiteMaintenanceState(validated);

      res.status(200).json({
        success: true,
        siteLocked: state.maintenanceEnabled,
        maintenanceEnabled: state.maintenanceEnabled,
        maintenanceMessage: state.maintenanceMessage,
        updatedAt: state.updatedAt,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.reduce((acc, err) => {
          const key = err.path.join('.');
          acc[key] = err.message;
          return acc;
        }, {} as Record<string, string>);

        next(ApiError.badRequest('Validation failed', details));
        return;
      }

      next(error);
    }
  };
}

export class SiteMaintenanceSecretController {
  verify = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { secret } = req.body;

      if (!secret || secret !== MAINTENANCE_SECRET) {
        next(ApiError.unauthorized('Invalid or missing secret'));
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Secret verified',
      });
    } catch (error) {
      next(error);
    }
  };

  toggle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { secret, action, message: customMessage } = req.body;

      if (!secret || secret !== MAINTENANCE_SECRET) {
        next(ApiError.unauthorized('Invalid or missing secret'));
        return;
      }

      if (!['enable', 'disable'].includes(action)) {
        next(
          ApiError.badRequest('Invalid action', {
            action: 'Must be "enable" or "disable"',
          })
        );
        return;
      }

      const state = await setSiteMaintenanceState({
        maintenanceEnabled: action === 'enable',
        maintenanceMessage:
          customMessage || "Payment pending. We'll reopen shortly.",
      });

      res.status(200).json({
        success: true,
        action,
        siteLocked: state.maintenanceEnabled,
        maintenanceMessage: state.maintenanceMessage,
        updatedAt: state.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const siteStatusController = new SiteStatusController();
export const siteMaintenanceSecretController = new SiteMaintenanceSecretController();
