import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

// This deliberately never provisions known test credentials on a remote DB.
const database = new URL(process.env.DATABASE_URL ?? '');
if (
  process.env.NODE_ENV === 'production' ||
  !['localhost', '127.0.0.1', '[::1]'].includes(database.hostname) ||
  database.pathname !== '/pathtrip'
) {
  throw new Error(
    'Test accounts can only be created in the local pathtrip database.'
  );
}

const prisma = new PrismaClient();
try {
  for (const account of [
    {
      email: 'test@pathtrip.local',
      nickname: '테스트 여행자',
      role: 'USER',
      password: process.env.LOCAL_TEST_USER_PASSWORD,
    },
    {
      email: 'admin@pathtrip.local',
      nickname: '테스트 관리자',
      role: 'ADMIN',
      password: process.env.LOCAL_TEST_ADMIN_PASSWORD,
    },
  ]) {
    if (
      !account.password ||
      Buffer.byteLength(account.password, 'utf8') < 12 ||
      Buffer.byteLength(account.password, 'utf8') > 72
    ) {
      throw new Error(
        'Set LOCAL_TEST_USER_PASSWORD and LOCAL_TEST_ADMIN_PASSWORD (12–72 bytes).'
      );
    }
    const existing = await prisma.user.findUnique({
      where: { email: account.email },
    });
    if (existing) {
      if (
        existing.deletedAt ||
        existing.role !== account.role ||
        !(await bcrypt.compare(account.password, existing.passwordHash))
      ) {
        throw new Error(
          `Existing account differs: ${account.email}. No credentials or roles were overwritten.`
        );
      }
      console.log(`Already ready: ${account.email} (${account.role})`);
      continue;
    }
    await prisma.user.create({
      data: {
        email: account.email,
        nickname: account.nickname,
        role: account.role,
        passwordHash: await bcrypt.hash(account.password, 10),
      },
    });
    console.log(`Created: ${account.email} (${account.role})`);
  }
} finally {
  await prisma.$disconnect();
}
