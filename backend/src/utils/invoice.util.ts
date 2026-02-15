import { prisma } from '../config/db.js';

/**
 * Invoice Number Generator
 *
 * Format: TV-YYYY-XXXX
 *   YYYY = current year
 *   XXXX = zero-padded sequential number (resets per year)
 *
 * Rules:
 *   - Must be unique (enforced by DB unique constraint)
 *   - Generated only once per order
 *   - Created atomically when order is CONFIRMED (after payment success)
 *   - Never regenerated
 */

/**
 * Generate the next invoice number for the current year.
 *
 * Uses a DB query to find the max existing invoice number for the year,
 * then increments. The caller MUST run this inside a transaction to
 * prevent race conditions.
 */
export async function generateInvoiceNumber(
    tx?: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
): Promise<string> {
    const db = tx ?? prisma;
    const year = new Date().getFullYear();
    const prefix = `TV-${year}-`;

    // Find the highest invoice number for this year
    const latest = await (db as any).order.findFirst({
        where: {
            invoiceNumber: { startsWith: prefix },
        },
        orderBy: { invoiceNumber: 'desc' },
        select: { invoiceNumber: true },
    });

    let nextSeq = 1;
    if (latest?.invoiceNumber) {
        const parts = (latest.invoiceNumber as string).split('-');
        const lastSeq = parseInt(parts[2] ?? '0', 10);
        if (!isNaN(lastSeq)) {
            nextSeq = lastSeq + 1;
        }
    }

    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}
