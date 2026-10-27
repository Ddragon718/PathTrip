CREATE TYPE "DestinationType" AS ENUM ('DOMESTIC', 'INTERNATIONAL');
CREATE TYPE "MapPreference" AS ENUM ('AUTO', 'KAKAO', 'GOOGLE');
ALTER TABLE "trips"
  ADD COLUMN "destination_type" "DestinationType" NOT NULL DEFAULT 'DOMESTIC',
  ADD COLUMN "map_preference" "MapPreference" NOT NULL DEFAULT 'AUTO';
