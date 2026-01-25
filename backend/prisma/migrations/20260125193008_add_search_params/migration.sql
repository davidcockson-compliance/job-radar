-- CreateTable
CREATE TABLE "RadarZone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "searchTitle" TEXT NOT NULL DEFAULT '',
    "searchLocation" TEXT NOT NULL DEFAULT '',
    "greenFlags" TEXT NOT NULL,
    "redFlags" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "JobLead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "location" TEXT,
    "jobUrl" TEXT NOT NULL,
    "description" TEXT,
    "source" TEXT NOT NULL,
    "matchScore" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'RADAR_NEW',
    "priority" INTEGER NOT NULL DEFAULT 3,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT,
    CONSTRAINT "JobLead_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanyProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompanyProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT NOT NULL,
    "companiesHouseId" TEXT,
    "industry" TEXT,
    "size" TEXT,
    "website" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "JobLead_jobUrl_key" ON "JobLead"("jobUrl");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyProfile_companyName_key" ON "CompanyProfile"("companyName");
