-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RadarZone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "searchTitle" TEXT NOT NULL DEFAULT '',
    "searchLocation" TEXT NOT NULL DEFAULT '',
    "greenFlags" TEXT NOT NULL,
    "redFlags" TEXT NOT NULL,
    "enabledSources" TEXT NOT NULL DEFAULT '["LinkedIn", "Indeed"]',
    "trackedBoards" TEXT NOT NULL DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_RadarZone" ("active", "createdAt", "enabledSources", "greenFlags", "id", "name", "redFlags", "searchLocation", "searchTitle", "updatedAt") SELECT "active", "createdAt", "enabledSources", "greenFlags", "id", "name", "redFlags", "searchLocation", "searchTitle", "updatedAt" FROM "RadarZone";
DROP TABLE "RadarZone";
ALTER TABLE "new_RadarZone" RENAME TO "RadarZone";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
