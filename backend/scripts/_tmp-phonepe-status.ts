import { phonepeService } from '../src/services/phonepe.service.js';
import { prisma } from '../src/config/db.js';

async function main() {
  const recent = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 6,
    select: {
      id: true,
      status: true,
      grandTotal: true,
      createdAt: true,
      payment: {
        select: { id: true, status: true, providerOrderId: true, amount: true },
      },
    },
  });

  for (const order of recent) {
    console.log(
      `\n### ${order.id} status=${order.status} total=${order.grandTotal} at=${order.createdAt.toISOString()}`
    );
    console.log('  payment:', JSON.stringify(order.payment));

    const merchantOrderId = order.payment?.providerOrderId;
    if (!merchantOrderId) continue;

    try {
      const status = await phonepeService.getOrderStatus(merchantOrderId);
      console.log('  phonepe:', JSON.stringify(status, null, 2));
    } catch (error: any) {
      console.log('  phonepe FAILED:', error?.message);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
