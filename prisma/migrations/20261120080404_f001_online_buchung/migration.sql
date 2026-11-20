-- CreateTable
CREATE TABLE "Patient" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "geburtsdatum" TEXT NOT NULL,
    "versichertennummer" TEXT,
    "onlineGesperrt" BOOLEAN NOT NULL DEFAULT false,
    "hausarztId" INTEGER,
    CONSTRAINT "Patient_hausarztId_fkey" FOREIGN KEY ("hausarztId") REFERENCES "Arzt" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Arzt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "aktiv" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Terminart" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bezeichnung" TEXT NOT NULL,
    "dauerMinuten" INTEGER NOT NULL,
    "onlineBuchbar" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "ArztTerminart" (
    "arztId" INTEGER NOT NULL,
    "terminartId" INTEGER NOT NULL,

    PRIMARY KEY ("arztId", "terminartId"),
    CONSTRAINT "ArztTerminart_arztId_fkey" FOREIGN KEY ("arztId") REFERENCES "Arzt" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ArztTerminart_terminartId_fkey" FOREIGN KEY ("terminartId") REFERENCES "Terminart" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sprechzeit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "arztId" INTEGER NOT NULL,
    "wochentag" INTEGER NOT NULL,
    "beginn" TEXT NOT NULL,
    "ende" TEXT NOT NULL,
    "akut" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Sprechzeit_arztId_fkey" FOREIGN KEY ("arztId") REFERENCES "Arzt" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Termin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "patientId" INTEGER NOT NULL,
    "arztId" INTEGER NOT NULL,
    "terminartId" INTEGER NOT NULL,
    "beginn" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'gebucht',
    CONSTRAINT "Termin_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Termin_arztId_fkey" FOREIGN KEY ("arztId") REFERENCES "Arzt" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Termin_terminartId_fkey" FOREIGN KEY ("terminartId") REFERENCES "Terminart" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reservierung" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" INTEGER NOT NULL,
    "arztId" INTEGER NOT NULL,
    "terminartId" INTEGER NOT NULL,
    "beginn" DATETIME NOT NULL,
    "ende" DATETIME NOT NULL,
    "ablaufAm" DATETIME NOT NULL,
    CONSTRAINT "Reservierung_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservierung_arztId_fkey" FOREIGN KEY ("arztId") REFERENCES "Arzt" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservierung_terminartId_fkey" FOREIGN KEY ("terminartId") REFERENCES "Terminart" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Patient_versichertennummer_key" ON "Patient"("versichertennummer");

-- CreateIndex
CREATE UNIQUE INDEX "Terminart_bezeichnung_key" ON "Terminart"("bezeichnung");

-- CreateIndex
CREATE INDEX "Termin_arztId_beginn_idx" ON "Termin"("arztId", "beginn");

-- CreateIndex
CREATE INDEX "Reservierung_arztId_beginn_idx" ON "Reservierung"("arztId", "beginn");
