import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // ─── Create Admin User ────────────────
  const adminPassword = await argon2.hash('Admin@123', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@deshyatra.com' },
    update: {},
    create: {
      email: 'admin@deshyatra.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'DeshYatra',
      role: 'SUPERADMIN',
      isEmailVerified: true,
      isActive: true,
    },
  });
  console.log(`  ✅ Admin user: ${admin.email}`);

  // ─── Create Test User ────────────────
  const userPassword = await argon2.hash('User@123', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@deshyatra.com' },
    update: {},
    create: {
      email: 'user@deshyatra.com',
      passwordHash: userPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'USER',
      isEmailVerified: true,
      isActive: true,
    },
  });
  console.log(`  ✅ Test user: ${user.email}`);

  // ─── Seed Travel Packages ─────────────
  const packages = [
    {
      title: 'Char Dham Yatra',
      subtitle: 'The ultimate Hindu pilgrimage circuit',
      category: 'PILGRIMAGE' as const,
      duration: '10-12 Days',
      price: 25000,
      rating: 4.8,
      reviewCount: 2340,
      locations: ['Yamunotri', 'Gangotri', 'Kedarnath', 'Badrinath'],
      highlights: [
        'Visit all four sacred shrines in Uttarakhand',
        'Helicopter option for Kedarnath',
        'Holy dip at Yamunotri & Gangotri',
        'Darshan at Badrinath Temple',
      ],
      bestTime: 'May – June, Sep – Oct',
      included: ['Accommodation', 'Meals', 'Transport', 'Guide', 'Permits'],
      status: 'AVAILABLE' as const,
      createdBy: admin.id,
    },
    {
      title: 'Do Dham Yatra',
      subtitle: 'Kedarnath & Badrinath spiritual journey',
      category: 'PILGRIMAGE' as const,
      duration: '6-7 Days',
      price: 15000,
      rating: 4.7,
      reviewCount: 1890,
      locations: ['Kedarnath', 'Badrinath'],
      highlights: [
        'Trek to Kedarnath Temple (16 km)',
        'Visit Badrinath Temple & Mana Village',
        'Hot springs at Tapt Kund',
        'Scenic Chopta valley views',
      ],
      bestTime: 'May – June, Sep – Oct',
      included: ['Accommodation', 'Meals', 'Transport', 'Guide'],
      status: 'AVAILABLE' as const,
      createdBy: admin.id,
    },
    {
      title: 'Valley of Flowers Trek',
      subtitle: 'UNESCO World Heritage alpine meadow trek',
      category: 'TREK' as const,
      duration: '6 Days',
      price: 12000,
      rating: 4.8,
      reviewCount: 1560,
      locations: ['Govindghat', 'Ghangaria', 'Valley of Flowers', 'Hemkund Sahib'],
      highlights: [
        'Trek through 600+ species of wildflowers',
        'Visit Hemkund Sahib Gurudwara',
        'UNESCO World Heritage Site',
        'Stunning Himalayan panoramas',
      ],
      bestTime: 'Jul – Sep',
      difficulty: 'MODERATE' as const,
      included: ['Camping', 'Meals', 'Guide', 'Permits', 'Equipment'],
      status: 'COMING_SOON' as const,
      createdBy: admin.id,
    },
    {
      title: 'Kedarkantha Trek',
      subtitle: 'Best winter trek in India with summit climb',
      category: 'TREK' as const,
      duration: '5 Days',
      price: 8500,
      rating: 4.7,
      reviewCount: 2100,
      locations: ['Sankri', 'Juda Ka Talab', 'Kedarkantha Base Camp', 'Kedarkantha Summit'],
      highlights: [
        'Summit at 12,500 ft with 360° views',
        'Snow-covered trails in winter',
        'Camp by frozen Juda Ka Talab lake',
        'Perfect for beginners',
      ],
      bestTime: 'Dec – Apr',
      difficulty: 'EASY' as const,
      included: ['Camping', 'Meals', 'Guide', 'Equipment', 'Transport from Dehradun'],
      status: 'COMING_SOON' as const,
      createdBy: admin.id,
    },
    {
      title: 'Golden Triangle Tour',
      subtitle: 'Delhi – Agra – Jaipur heritage circuit',
      category: 'HERITAGE' as const,
      duration: '5-6 Days',
      price: 18000,
      rating: 4.6,
      reviewCount: 3200,
      locations: ['Delhi', 'Agra', 'Jaipur'],
      highlights: [
        'Taj Mahal sunrise visit',
        'Amber Fort elephant ride',
        'Old Delhi heritage walk',
        "Jaipur's pink city markets",
      ],
      bestTime: 'Oct – Mar',
      included: ['Hotels', 'Breakfast', 'AC Transport', 'Guide', 'Entry tickets'],
      status: 'COMING_SOON' as const,
      createdBy: admin.id,
    },
    {
      title: 'Ladakh Adventure Expedition',
      subtitle: 'Conquer the highest motorable passes',
      category: 'ADVENTURE' as const,
      duration: '8-10 Days',
      price: 28000,
      rating: 4.8,
      reviewCount: 2050,
      locations: ['Leh', 'Nubra Valley', 'Pangong Lake', 'Khardung La', 'Tso Moriri'],
      highlights: [
        'Drive over Khardung La (17,982 ft)',
        'Camp at Pangong Lake',
        'Double-humped camel ride at Hunder',
        'Visit ancient monasteries',
      ],
      bestTime: 'Jun – Sep',
      difficulty: 'MODERATE' as const,
      included: ['Hotels & Camps', 'Meals', 'Bike/SUV', 'Permits', 'Oxygen'],
      status: 'COMING_SOON' as const,
      createdBy: admin.id,
    },
  ];

  for (const pkg of packages) {
    await prisma.package.upsert({
      where: { id: pkg.title.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: pkg,
    });
  }
  console.log(`  ✅ ${packages.length} packages seeded`);

  console.log('✅ Seeding complete!');
}

seed()
  .catch((err) => {
    console.error('❌ Seed error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
