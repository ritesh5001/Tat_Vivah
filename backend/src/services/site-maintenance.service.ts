import { prisma } from '../config/db.js';

export interface SiteMaintenanceState {
  maintenanceEnabled: boolean;
  maintenanceMessage: string;
  updatedAt: string | null;
}

export interface SiteMaintenanceUpdateInput {
  maintenanceEnabled: boolean;
  maintenanceMessage?: string;
}

export const SITE_MAINTENANCE_KEY = 'site_maintenance';
export const DEFAULT_MAINTENANCE_MESSAGE = "Payment pending. We'll reopen shortly.";

function normalizeMessage(message?: string): string {
  const trimmed = message?.trim();
  return trimmed ? trimmed : DEFAULT_MAINTENANCE_MESSAGE;
}

function normalizeValue(value: unknown): { enabled: boolean; message: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { enabled: false, message: DEFAULT_MAINTENANCE_MESSAGE };
  }

  const payload = value as Record<string, unknown>;
  return {
    enabled: Boolean(payload.enabled),
    message:
      typeof payload.message === 'string' && payload.message.trim().length > 0
        ? payload.message.trim()
        : DEFAULT_MAINTENANCE_MESSAGE,
  };
}

function toState(record: { value: unknown; updatedAt: Date }): SiteMaintenanceState {
  const payload = normalizeValue(record.value);
  return {
    maintenanceEnabled: payload.enabled,
    maintenanceMessage: payload.message,
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function saveDefaultMaintenanceState(): Promise<SiteMaintenanceState> {
  const record = await prisma.siteSetting.upsert({
    where: { key: SITE_MAINTENANCE_KEY },
    update: {
      value: {
        enabled: false,
        message: DEFAULT_MAINTENANCE_MESSAGE,
      },
    },
    create: {
      key: SITE_MAINTENANCE_KEY,
      value: {
        enabled: false,
        message: DEFAULT_MAINTENANCE_MESSAGE,
      },
    },
  });

  return toState(record);
}

export async function ensureSiteMaintenanceState(): Promise<SiteMaintenanceState> {
  return saveDefaultMaintenanceState();
}

export async function getSiteMaintenanceState(): Promise<SiteMaintenanceState> {
  const record = await prisma.siteSetting.findUnique({
    where: { key: SITE_MAINTENANCE_KEY },
  });

  if (!record) {
    return {
      maintenanceEnabled: false,
      maintenanceMessage: DEFAULT_MAINTENANCE_MESSAGE,
      updatedAt: null,
    };
  }

  return toState(record);
}

export async function setSiteMaintenanceState(
  input: SiteMaintenanceUpdateInput
): Promise<SiteMaintenanceState> {
  const record = await prisma.siteSetting.upsert({
    where: { key: SITE_MAINTENANCE_KEY },
    update: {
      value: {
        enabled: input.maintenanceEnabled,
        message: normalizeMessage(input.maintenanceMessage),
      },
    },
    create: {
      key: SITE_MAINTENANCE_KEY,
      value: {
        enabled: input.maintenanceEnabled,
        message: normalizeMessage(input.maintenanceMessage),
      },
    },
  });

  return toState(record);
}
