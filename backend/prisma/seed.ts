import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@replyflow.com' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@replyflow.com',
      passwordHash,
      defaultCountry: 'PK',
    },
  });

  console.log({ demoUser });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
