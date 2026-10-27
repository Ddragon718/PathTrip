CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "PlaceCategory" AS ENUM ('RESTAURANT', 'CAFE', 'TOURIST_SPOT', 'HOTEL', 'PHOTO_SPOT', 'ETC');
CREATE TYPE "PlacePriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');
CREATE TYPE "OptimizationType" AS ENUM ('DISTANCE', 'TIME', 'FOOD', 'CAFE', 'TOUR', 'PHOTO');

CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trips" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "places" (
    "id" SERIAL NOT NULL,
    "trip_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "category" "PlaceCategory" NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "priority" "PlacePriority" NOT NULL DEFAULT 'MEDIUM',
    "stay_time_minutes" INTEGER NOT NULL DEFAULT 60,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "routes" (
    "id" SERIAL NOT NULL,
    "trip_id" INTEGER NOT NULL,
    "name" TEXT,
    "total_distance_meters" INTEGER NOT NULL DEFAULT 0,
    "total_move_time_minutes" INTEGER NOT NULL DEFAULT 0,
    "optimization_type" "OptimizationType" NOT NULL DEFAULT 'TIME',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "route_places" (
    "id" SERIAL NOT NULL,
    "route_id" INTEGER NOT NULL,
    "place_id" INTEGER NOT NULL,
    "visit_order" INTEGER NOT NULL,
    "estimated_arrival_time" TIMESTAMP(3),
    "move_time_from_previous_minutes" INTEGER,
    "distance_from_previous_meters" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "route_places_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "trips_user_id_deleted_at_idx" ON "trips"("user_id", "deleted_at");
CREATE INDEX "trips_start_date_idx" ON "trips"("start_date");
CREATE INDEX "places_trip_id_deleted_at_idx" ON "places"("trip_id", "deleted_at");
CREATE INDEX "places_category_idx" ON "places"("category");
CREATE INDEX "places_latitude_longitude_idx" ON "places"("latitude", "longitude");
CREATE INDEX "routes_trip_id_deleted_at_idx" ON "routes"("trip_id", "deleted_at");
CREATE INDEX "route_places_place_id_idx" ON "route_places"("place_id");
CREATE UNIQUE INDEX "route_places_route_id_visit_order_key" ON "route_places"("route_id", "visit_order");
CREATE UNIQUE INDEX "route_places_route_id_place_id_key" ON "route_places"("route_id", "place_id");

ALTER TABLE "trips" ADD CONSTRAINT "trips_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "places" ADD CONSTRAINT "places_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "routes" ADD CONSTRAINT "routes_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "route_places" ADD CONSTRAINT "route_places_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "route_places" ADD CONSTRAINT "route_places_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
