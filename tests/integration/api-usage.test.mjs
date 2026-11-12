import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { prisma } from '../../dist/lib/prisma.js';
import { apiUsageRepository } from '../../dist/modules/api-usage/api-usage.repository.js';

test('실제 PostgreSQL: 동시 예약·재연결·일간/월간 갱신에도 한도를 초과하지 않는다', async () => {
  const url = new URL(process.env.DATABASE_URL);
  assert.ok(
    ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname),
    '로컬 DB에서만 실행합니다.'
  );
  assert.equal(
    process.env.ALLOW_LOCAL_DB_TESTS,
    'true',
    'ALLOW_LOCAL_DB_TESTS=true가 필요합니다.'
  );
  const service = `test-api-usage-${randomUUID()}`;
  const reserve = (day, month) =>
    apiUsageRepository.reserve(service, day, month, 20, 25);
  try {
    const attempts = await Promise.all(
      Array.from({ length: 60 }, () => reserve('2026-11-12', '2026-11'))
    );
    assert.equal(attempts.filter(Boolean).length, 20);
    await prisma.$disconnect();
    assert.equal(await reserve('2026-11-12', '2026-11'), false);
    const nextDay = await Promise.all(
      Array.from({ length: 20 }, () => reserve('2026-11-13', '2026-11'))
    );
    assert.equal(nextDay.filter(Boolean).length, 5);
    assert.equal(await reserve('2026-11-14', '2026-11'), false);
    assert.equal(await reserve('2026-12-01', '2026-12'), true);
    // A delayed request must never roll back a new period and reset its counter.
    assert.equal(await reserve('2026-11-30', '2026-11'), false);
    const row = await prisma.apiUsage.findUniqueOrThrow({ where: { service } });
    assert.equal(row.dailyCount, 1);
    assert.equal(row.monthlyCount, 1);
  } finally {
    await prisma.apiUsage.deleteMany({ where: { service } });
    await prisma.$disconnect();
  }
});
