'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export default function SecretMaintenanceAdminPage() {
  const [secret, setSecret] = useState('');
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState("Payment pending. We'll reopen shortly.");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    locked: boolean;
    message: string;
    updatedAt: string | null;
  } | null>(null);

  const verifySecret = async () => {
    if (!secret.trim()) {
      toast.error('Please enter the secret code');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/site-status/secret/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: secret.trim() }),
      });

      if (!res.ok) {
        toast.error('Invalid secret code');
        return;
      }

      setVerified(true);
      await fetchStatus();
      toast.success('✅ Secret verified');
    } catch (error) {
      toast.error('Verification failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/site-status');
      const data = await res.json();
      setStatus({
        locked: data.maintenanceEnabled,
        message: data.maintenanceMessage,
        updatedAt: data.updatedAt,
      });
    } catch (error) {
      toast.error('Failed to fetch status');
      console.error(error);
    }
  };

  const toggle = async (action: 'enable' | 'disable') => {
    setLoading(true);
    try {
      const res = await fetch('/api/site-status/secret/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: secret.trim(),
          action,
          message: action === 'enable' ? message.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || `Failed to ${action} maintenance`);
        return;
      }

      setStatus({
        locked: data.siteLocked,
        message: data.maintenanceMessage,
        updatedAt: data.updatedAt,
      });

      toast.success(
        action === 'enable'
          ? '🔒 Site locked for maintenance'
          : '🔓 Site unlocked - back online'
      );
    } catch (error) {
      toast.error('Request failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!verified) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">🔐 Maintenance Access</h1>
          <p className="mb-6 text-gray-600">Enter the secret code to access site controls.</p>

          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && verifySecret()}
            placeholder="Enter secret code..."
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />

          <button
            onClick={verifySecret}
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Unlock Access'}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🔒 Site Maintenance</h1>
            <p className="text-gray-600">Toggle the storefront on/off instantly</p>
          </div>
          <button
            onClick={() => setVerified(false)}
            className="rounded bg-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-400"
          >
            Logout
          </button>
        </div>

        {/* Status Card */}
        {status && (
          <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Current Status:</span>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                  status.locked
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {status.locked ? '🔒 LOCKED' : '🔓 UNLOCKED'}
              </span>
            </div>
            <p className="mb-2 text-gray-700">{status.message}</p>
            <p className="text-xs text-gray-500">
              {status.updatedAt
                ? `Last updated: ${new Date(status.updatedAt).toLocaleString()}`
                : 'Never updated'}
            </p>
          </div>
        )}

        {/* Control Form */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700">
              Maintenance Message (when locking)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter message to display when site is locked..."
              rows={3}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => toggle('enable')}
              disabled={loading}
              className="flex-1 rounded-lg bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : '🔒 Lock Site'}
            </button>
            <button
              onClick={() => toggle('disable')}
              disabled={loading}
              className="flex-1 rounded-lg bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : '🔓 Unlock Site'}
            </button>
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="rounded-lg bg-gray-200 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-300 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
