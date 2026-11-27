-- CreateTable
CREATE TABLE "Abwesenheit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "arztId" INTEGER,
    "von" DATETIME NOT NULL,
    "bis" DATETIME NOT NULL,
    "grund" TEXT NOT NULL,
    CONSTRAINT "Abwesenheit_arztId_fkey" FOREIGN KEY ("arztId") REFERENCES "Arzt" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Abwesenheit_von_bis_idx" ON "Abwesenheit"("von", "bis");
