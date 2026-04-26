-- CreateTable
CREATE TABLE "AlumniMaster" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nomerInduk" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "asal" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AlumniSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alumniMasterId" TEXT NOT NULL,
    "domisili" TEXT NOT NULL,
    "kesibukan" TEXT NOT NULL,
    "kontakPerson" TEXT NOT NULL,
    "sosialMedia" TEXT NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AlumniSubmission_alumniMasterId_fkey" FOREIGN KEY ("alumniMasterId") REFERENCES "AlumniMaster" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AlumniMaster_nomerInduk_key" ON "AlumniMaster"("nomerInduk");

-- CreateIndex
CREATE INDEX "AlumniMaster_namaLengkap_idx" ON "AlumniMaster"("namaLengkap");

-- CreateIndex
CREATE UNIQUE INDEX "AlumniSubmission_alumniMasterId_key" ON "AlumniSubmission"("alumniMasterId");
