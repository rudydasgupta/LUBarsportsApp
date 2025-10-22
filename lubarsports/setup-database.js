const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function setupDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Setting up database...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Check if super admin exists
    const existingAdmin = await prisma.admin.findFirst({
      where: { email: 'r.dasgupta@lancaster.ac.uk' }
    });
    
    if (existingAdmin) {
      console.log('✅ Super admin already exists');
    } else {
      console.log('Creating super admin...');
      const hashedPassword = await bcrypt.hash('Avengers2004', 10);
      
      const superAdmin = await prisma.admin.create({
        data: {
          email: 'r.dasgupta@lancaster.ac.uk',
          password: hashedPassword,
          fullName: 'Super Admin',
          adminType: 'SUPER'
        }
      });
      
      console.log('✅ Super admin created:', superAdmin.email);
    }
    
    // Check if we have any divisions/teams
    const divisionCount = await prisma.division.count();
    console.log(`Divisions: ${divisionCount}`);
    
    const teamCount = await prisma.team.count();
    console.log(`Teams: ${teamCount}`);
    
    if (divisionCount === 0) {
      console.log('⚠️  No divisions found. You may need to run the seed script.');
    }
    
  } catch (error) {
    console.error('❌ Database setup error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();
