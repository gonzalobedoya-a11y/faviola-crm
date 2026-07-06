-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('NEW', 'SENT', 'VIEWED', 'DISCARDED', 'CONVERTED');

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "reasons" JSONB NOT NULL DEFAULT '[]',
    "status" "MatchStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "matches_tenantId_score_idx" ON "matches"("tenantId", "score");

-- CreateIndex
CREATE INDEX "matches_tenantId_status_idx" ON "matches"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "matches_clientId_propertyId_key" ON "matches"("clientId", "propertyId");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
