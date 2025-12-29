-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "location" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceType" TEXT,
    "recurrenceEnd" DATETIME,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("createdAt", "description", "endTime", "id", "location", "startTime", "title", "updatedAt", "userId") SELECT "createdAt", "description", "endTime", "id", "location", "startTime", "title", "updatedAt", "userId" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE INDEX "Event_userId_idx" ON "Event"("userId");
CREATE INDEX "Event_startTime_idx" ON "Event"("startTime");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
