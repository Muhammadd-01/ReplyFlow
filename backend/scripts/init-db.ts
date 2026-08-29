import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to database and creating a dummy record...');
  
  // We'll just try to count users to see if it connects
  const count = await prisma.user.count();
  console.log('Current users count:', count);
  
  if (count === 0) {
    console.log('Creating a dummy user to initialize the database...');
    await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: 'dummy_hash',
        name: 'Test User'
      }
    });
    console.log('Dummy user created successfully.');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
