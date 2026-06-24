export type SiteMaintenanceState = {
  maintenanceEnabled: boolean;
  maintenanceMessage: string;
  updatedAt: string | null;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '');

function normalizeMaintenanceState(payload: unknown): SiteMaintenanceState | null {
  if (!payload || typeof payload !== 'object') return null;

  const data = payload as Record<string, unknown>;
  const enabled = Boolean(data.maintenanceEnabled ?? data.siteLocked);
  const message =
    typeof data.maintenanceMessage === 'string' && data.maintenanceMessage.trim().length > 0
      ? data.maintenanceMessage.trim()
      : "Payment pending. We'll reopen shortly.";
  const updatedAt = typeof data.updatedAt === 'string' ? data.updatedAt : null;

  return {
    maintenanceEnabled: enabled,
    maintenanceMessage: message,
    updatedAt,
  };
}

async function fetchMaintenanceState(): Promise<SiteMaintenanceState | null> {
  if (!API_BASE_URL) return null;

  const response = await fetch(`${API_BASE_URL}/v1/site-status`, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      'x-maintenance-check': '1',
    },
  });

  if (!response.ok) return null;

  const payload = await response.json().catch(() => null);
  return normalizeMaintenanceState(payload);
}

export async function getMaintenanceState(): Promise<SiteMaintenanceState | null> {
  try {
    return await fetchMaintenanceState();
  } catch {
    return null;
  }
}
