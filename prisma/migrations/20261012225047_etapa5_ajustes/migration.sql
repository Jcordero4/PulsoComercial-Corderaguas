/*
  Warnings:

  - The required column `groupId` was added to the `Adjustment` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Adjustment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "deltaCount" INTEGER NOT NULL,
    "deltaAmount" DECIMAL NOT NULL DEFAULT 0,
    "groupId" TEXT NOT NULL,
    "afterType" TEXT,
    "afterAmount" DECIMAL,
    "reason" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodYear" INTEGER NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    CONSTRAINT "Adjustment_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Adjustment_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Adjustment_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Adjustment" ("activityId", "actorId", "createdAt", "deltaAmount", "deltaCount", "id", "kind", "periodMonth", "periodYear", "reason", "sellerId", "type") SELECT "activityId", "actorId", "createdAt", "deltaAmount", "deltaCount", "id", "kind", "periodMonth", "periodYear", "reason", "sellerId", "type" FROM "Adjustment";
DROP TABLE "Adjustment";
ALTER TABLE "new_Adjustment" RENAME TO "Adjustment";
CREATE INDEX "Adjustment_sellerId_periodYear_periodMonth_idx" ON "Adjustment"("sellerId", "periodYear", "periodMonth");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
