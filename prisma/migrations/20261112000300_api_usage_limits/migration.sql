CREATE TABLE "api_usage" (
    "service" TEXT NOT NULL,
    "day" VARCHAR(10) NOT NULL,
    "month" VARCHAR(7) NOT NULL,
    "daily_count" INTEGER NOT NULL CHECK ("daily_count" >= 0),
    "monthly_count" INTEGER NOT NULL CHECK ("monthly_count" >= 0),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "api_usage_pkey" PRIMARY KEY ("service")
);
