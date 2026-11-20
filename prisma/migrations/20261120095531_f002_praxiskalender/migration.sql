-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Patient" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "geburtsdatum" TEXT NOT NULL,
    "versichertennummer" TEXT,
    "onlineGesperrt" BOOLEAN NOT NULL DEFAULT false,
    "smsEinwilligung" BOOLEAN NOT NULL DEFAULT false,
    "hausarztId" INTEGER,
    CONSTRAINT "Patient_hausarztId_fkey" FOREIGN KEY ("hausarztId") REFERENCES "Arzt" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Patient" ("geburtsdatum", "hausarztId", "id", "name", "onlineGesperrt", "versichertennummer") SELECT "geburtsdatum", "hausarztId", "id", "name", "onlineGesperrt", "versichertennummer" FROM "Patient";
DROP TABLE "Patient";
ALTER TABLE "new_Patient" RENAME TO "Patient";
CREATE UNIQUE INDEX "Patient_versichertennummer_key" ON "Patient"("versichertennummer");
CREATE TABLE "new_Termin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "patientId" INTEGER NOT NULL,
    "arztId" INTEGER NOT NULL,
    "terminartId" INTEGER NOT NULL,
    "beginn" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'gebucht',
    "quelle" TEXT NOT NULL DEFAULT 'online',
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Termin_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Termin_arztId_fkey" FOREIGN KEY ("arztId") REFERENCES "Arzt" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Termin_terminartId_fkey" FOREIGN KEY ("terminartId") REFERENCES "Terminart" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Termin" ("arztId", "beginn", "id", "patientId", "status", "terminartId") SELECT "arztId", "beginn", "id", "patientId", "status", "terminartId" FROM "Termin";
DROP TABLE "Termin";
ALTER TABLE "new_Termin" RENAME TO "Termin";
CREATE INDEX "Termin_arztId_beginn_idx" ON "Termin"("arztId", "beginn");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
