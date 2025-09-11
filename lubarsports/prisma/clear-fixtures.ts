import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.fixture.deleteMany({});
  console.log('All fixtures deleted.');
}

main().finally(() => prisma.$disconnect()); 