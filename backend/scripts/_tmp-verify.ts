import { prisma } from '../src/config/db.js';

const ALPHA = /^(XXS|XS|S|M|L|XL|XXL|3XL|4XL|5XL|Free Size)$/;

async function main() {
  const rows = await prisma.productVariant.findMany({
    select: { size: true, color: true, colorHex: true, sku: true },
  });
  const badSize = rows.filter((r) => /[A-Za-z]/.test(r.size) && !ALPHA.test(r.size));
  console.log(
    `total=${rows.length} colourNull=${rows.filter((r) => !r.color).length}` +
      ` hexNull=${rows.filter((r) => !r.colorHex).length} badSize=${badSize.length}`
  );
  if (badSize.length) console.log('  examples:', [...new Set(badSize.map((r) => r.size))].slice(0, 10));
}

main().catch(console.error).finally(() => prisma.$disconnect());
