-- Seasons, league settings, audit log, announcements and a stronger admin
-- model. Everything here is additive: no existing row is deleted, and all
-- 2025/26 fixtures and results are attached to an archived 2025/26 season.

-- ---------------------------------------------------------------------------
-- Seasons
-- ---------------------------------------------------------------------------
CREATE TABLE "Season" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "michaelmasStart" TIMESTAMP(3) NOT NULL,
    "lentStart" TIMESTAMP(3) NOT NULL,
    "winBonus" INTEGER NOT NULL DEFAULT 2,
    "drawBonus" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Season_name_key" ON "Season"("name");
CREATE UNIQUE INDEX "Season_slug_key" ON "Season"("slug");

-- Last season: Michaelmas week 1 began Monday 6 October 2025 (the first
-- fixtures, week 2, were on 13 October) and Lent week 11 on 12 January 2026.
-- It stays current until the new season is started, so the live site keeps
-- working between deploying this migration and creating 2026/27.
INSERT INTO "Season" ("name", "slug", "status", "isCurrent", "michaelmasStart", "lentStart", "winBonus", "drawBonus", "notes")
VALUES ('2025/26', '2025-26', 'ACTIVE', true, '2025-10-06 12:00:00', '2026-01-12 12:00:00', 2, 0, NULL);

-- ---------------------------------------------------------------------------
-- League settings
-- ---------------------------------------------------------------------------
ALTER TABLE "Division" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "framesPerMatch" INTEGER,
ADD COLUMN "matchDay" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "slug" TEXT,
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Slugs match the old /league/<slug> URLs so existing links keep working.
-- Match nights and frame counts are the ones used in 2025/26.
UPDATE "Division" SET "slug" = 'open-as-pool',  "matchDay" = 1, "framesPerMatch" = 9, "sortOrder" = 1 WHERE "name" = 'Open A''s Pool';
UPDATE "Division" SET "slug" = 'open-bs-pool',  "matchDay" = 1, "framesPerMatch" = 7, "sortOrder" = 2 WHERE "name" = 'Open B''s Pool';
UPDATE "Division" SET "slug" = 'womens-pool',   "matchDay" = 0, "framesPerMatch" = 5, "sortOrder" = 3 WHERE "name" = 'Women''s+ Pool';
UPDATE "Division" SET "slug" = 'open-darts',    "matchDay" = 0, "framesPerMatch" = 9, "sortOrder" = 4 WHERE "name" = 'Open Darts';
UPDATE "Division" SET "slug" = 'womens-darts',  "matchDay" = 1, "framesPerMatch" = 5, "sortOrder" = 5 WHERE "name" = 'Women''s+ Darts';
UPDATE "Division" SET "slug" = 'dominoes',      "matchDay" = 0, "framesPerMatch" = 3, "sortOrder" = 6 WHERE "name" = 'Dominoes';
-- Any other league gets a slug made from its name.
UPDATE "Division"
SET "slug" = trim(both '-' from lower(regexp_replace("name", '[^a-zA-Z0-9]+', '-', 'g'))) || '-' || "id",
    "sortOrder" = 100 + "id"
WHERE "slug" IS NULL;

ALTER TABLE "Division" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Division_slug_key" ON "Division"("slug");

-- ---------------------------------------------------------------------------
-- Fixtures belong to a season and a league week
-- ---------------------------------------------------------------------------
ALTER TABLE "Fixture" ADD COLUMN "notes" TEXT,
ADD COLUMN "seasonId" INTEGER,
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "week" INTEGER;

UPDATE "Fixture" SET "seasonId" = (SELECT "id" FROM "Season" WHERE "slug" = '2025-26');

-- Week numbers from the Monday of each fixture's week.
UPDATE "Fixture"
SET "week" = CASE
    WHEN "date" < '2026-01-01' THEN 1 + (date_trunc('week', "date")::date - DATE '2025-10-06') / 7
    ELSE 11 + (date_trunc('week', "date")::date - DATE '2026-01-12') / 7
END;

-- The week-10 "N/A vs N/A" rows were placeholders for a week with no
-- matches. Keep them, but mark them so they are never shown or counted.
UPDATE "Fixture"
SET "status" = 'VOID'
WHERE "homeTeamId" IN (SELECT "id" FROM "Team" WHERE "name" = 'N/A')
   OR "awayTeamId" IN (SELECT "id" FROM "Team" WHERE "name" = 'N/A');

ALTER TABLE "Fixture" ALTER COLUMN "seasonId" SET NOT NULL;
CREATE INDEX "Fixture_seasonId_week_idx" ON "Fixture"("seasonId", "week");
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Results: who entered them and when
-- ---------------------------------------------------------------------------
ALTER TABLE "Result" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "enteredBy" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Existing results were not timestamped; use the match date.
UPDATE "Result" r
SET "createdAt" = f."date", "updatedAt" = f."date"
FROM "Fixture" f
WHERE f."id" = r."fixtureId";

-- ---------------------------------------------------------------------------
-- Points adjustments (deductions and bonuses, per season)
-- ---------------------------------------------------------------------------
CREATE TABLE "PointsAdjustment" (
    "id" SERIAL NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "divisionId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointsAdjustment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PointsAdjustment_seasonId_divisionId_idx" ON "PointsAdjustment"("seasonId", "divisionId");
ALTER TABLE "PointsAdjustment" ADD CONSTRAINT "PointsAdjustment_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PointsAdjustment" ADD CONSTRAINT "PointsAdjustment_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PointsAdjustment" ADD CONSTRAINT "PointsAdjustment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Admin accounts
-- ---------------------------------------------------------------------------
ALTER TABLE "Admin" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "college" TEXT,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "lastLoginAt" TIMESTAMP(3),
ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------------------
-- Audit log and announcements
-- ---------------------------------------------------------------------------
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" INTEGER,
    "actorName" TEXT,
    "action" TEXT NOT NULL,
    "summary" TEXT NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

CREATE TABLE "Announcement" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'info',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

INSERT INTO "AuditLog" ("createdAt", "actorName", "action", "summary")
VALUES (now() AT TIME ZONE 'UTC', 'System', 'season.migrate', 'Seasons introduced: 2025/26 fixtures and results attached to the 2025/26 season.');
