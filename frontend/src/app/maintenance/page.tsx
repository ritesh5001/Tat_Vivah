import type { Metadata } from 'next';
import { getMaintenanceState } from '@/lib/site-maintenance';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Temporarily Closed',
  description: 'TatVivah is temporarily closed for maintenance.',
};

export default async function MaintenancePage() {
  const state = await getMaintenanceState();
  const message = state?.maintenanceMessage ?? "Payment pending. We'll reopen shortly.";

  return (
    <main className="min-h-screen bg-[#f7f2e8] text-[#241f1c]">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-full border border-[#d8c9b5] bg-white shadow-[0_10px_30px_rgba(36,31,28,0.08)]">
          <span className="text-2xl">✦</span>
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.32em] text-[#8d6f4a]">
          Temporarily Closed
        </p>
        <h1 className="max-w-xl font-serif text-4xl leading-tight text-[#1f1a17] sm:text-5xl">
          We&apos;ll reopen shortly.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-[#5f554d] sm:text-lg">
          {message}
        </p>

        <div className="mt-10 rounded-2xl border border-[#e2d7c8] bg-white px-6 py-4 text-sm text-[#6f6257] shadow-[0_12px_30px_rgba(36,31,28,0.06)]">
          The storefront is currently unavailable. Please check back later.
        </div>
      </div>
    </main>
  );
}
