CREATE TABLE "region_visits" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "region_id" TEXT NOT NULL,
  "verified_at" TIMESTAMP(3) NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "region_visits_user_id_region_id_key" ON "region_visits"("user_id", "region_id");
CREATE TABLE "visitor_recommendations" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "region_id" TEXT NOT NULL,
  "category" "PlaceCategory" NOT NULL,
  "place_name" TEXT NOT NULL,
  "address" TEXT,
  "note" TEXT NOT NULL,
  "verified_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3)
);
CREATE INDEX "visitor_recommendations_region_id_category_deleted_at_created_idx" ON "visitor_recommendations"("region_id", "category", "deleted_at", "created_at");
