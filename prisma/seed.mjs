import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  const passwordHash = await bcrypt.hash('pathtrip1234', 10);
  const user = await prisma.user.upsert({
    where: { email: 'demo@pathtrip.local' },
    update: { nickname: 'PathTrip Demo', deletedAt: null },
    create: {
      email: 'demo@pathtrip.local',
      passwordHash,
      nickname: 'PathTrip Demo',
    },
  });

  const existingTrip = await prisma.trip.findFirst({
    where: { userId: user.id, title: '제주 데모 여행', deletedAt: null },
  });

  if (!existingTrip) {
    await prisma.trip.create({
      data: {
        userId: user.id,
        title: '제주 데모 여행',
        region: '제주',
        startDate: new Date('2026-06-01T00:00:00.000Z'),
        endDate: new Date('2026-06-03T00:00:00.000Z'),
        places: {
          create: [
            {
              name: '협재해수욕장',
              category: 'TOURIST_SPOT',
              address: '제주특별자치도 제주시 한림읍 협재리',
              latitude: 33.393,
              longitude: 126.239,
              priority: 'HIGH',
              stayTimeMinutes: 60,
            },
            {
              name: '한림공원',
              category: 'TOURIST_SPOT',
              address: '제주특별자치도 제주시 한림읍 한림로 300',
              latitude: 33.389,
              longitude: 126.239,
              priority: 'MEDIUM',
              stayTimeMinutes: 90,
            },
          ],
        },
      },
    });
  }

  console.log('Seed complete: demo@pathtrip.local / pathtrip1234');
} finally {
  await prisma.$disconnect();
}
