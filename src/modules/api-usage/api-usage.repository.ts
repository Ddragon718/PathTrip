import { prisma } from '../../lib/prisma.js';

export const apiUsageRepository = {
  // One conditional UPSERT reserves both limits atomically across all processes.
  // Reject stale periods as well: a delayed request must not reset counters back.
  async reserve(
    service: string,
    day: string,
    month: string,
    dailyLimit: number,
    monthlyLimit: number
  ): Promise<boolean> {
    const rows = await prisma.$queryRaw<{ service: string }[]>`
      INSERT INTO "api_usage"
        ("service", "day", "month", "daily_count", "monthly_count", "updated_at")
      VALUES (${service}, ${day}, ${month}, 1, 1, CURRENT_TIMESTAMP)
      ON CONFLICT ("service") DO UPDATE SET
        "day" = EXCLUDED."day",
        "month" = EXCLUDED."month",
        "daily_count" = CASE WHEN "api_usage"."day" = EXCLUDED."day"
          THEN "api_usage"."daily_count" + 1 ELSE 1 END,
        "monthly_count" = CASE WHEN "api_usage"."month" = EXCLUDED."month"
          THEN "api_usage"."monthly_count" + 1 ELSE 1 END,
        "updated_at" = CURRENT_TIMESTAMP
      WHERE "api_usage"."day" <= EXCLUDED."day"
        AND "api_usage"."month" <= EXCLUDED."month"
        AND ("api_usage"."day" <> EXCLUDED."day" OR "api_usage"."daily_count" < ${dailyLimit})
        AND ("api_usage"."month" <> EXCLUDED."month" OR "api_usage"."monthly_count" < ${monthlyLimit})
      RETURNING "service"
    `;
    return rows.length === 1;
  },
};
