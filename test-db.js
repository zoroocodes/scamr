const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    // Test connection
    await prisma.$connect();
    console.log('Successfully connected to database');

    // Try to create a test post
    const testPost = await prisma.cAPost.create({
      data: {
        ca: 'test_contract_address_' + Date.now(),
        message: 'Test message for database connectivity ' + Date.now(),
        twitter: 'testuser', // optional field
      },
    });
    console.log('Successfully created test post:', testPost);

    // Verify the post exists
    const verifyPost = await prisma.cAPost.findUnique({
      where: { id: testPost.id },
    });
    console.log('Verified post:', verifyPost);

  } catch (error) {
    console.error('Database test failed:', {
      name: error.name,
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();