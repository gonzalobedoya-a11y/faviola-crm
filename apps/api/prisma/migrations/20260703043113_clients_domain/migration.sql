-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('BUYER', 'SELLER', 'BOTH');

-- CreateEnum
CREATE TYPE "ClientTemperature" AS ENUM ('HOT', 'WARM', 'COLD');

-- CreateEnum
CREATE TYPE "Operation" AS ENUM ('SALE', 'RENT');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('NOTE', 'CALL', 'MESSAGE', 'VISIT', 'EMAIL', 'STATUS_CHANGE', 'CREATED');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('USER', 'AI', 'SYSTEM');

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "ClientType" NOT NULL DEFAULT 'BUYER',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "source" TEXT,
    "temperature" "ClientTemperature" NOT NULL DEFAULT 'WARM',
    "score" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "ownerId" TEXT NOT NULL,
    "lastContactAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_requirements" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "operation" "Operation" NOT NULL DEFAULT 'SALE',
    "propertyType" TEXT,
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "bedroomsMin" INTEGER,
    "bathroomsMin" INTEGER,
    "areaMin" INTEGER,
    "zones" TEXT[],
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "message" TEXT NOT NULL,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "actorType" "ActorType" NOT NULL DEFAULT 'USER',
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clients_tenantId_type_idx" ON "clients"("tenantId", "type");

-- CreateIndex
CREATE INDEX "clients_tenantId_temperature_idx" ON "clients"("tenantId", "temperature");

-- CreateIndex
CREATE INDEX "clients_tenantId_ownerId_idx" ON "clients"("tenantId", "ownerId");

-- CreateIndex
CREATE INDEX "clients_tenantId_lastContactAt_idx" ON "clients"("tenantId", "lastContactAt");

-- CreateIndex
CREATE UNIQUE INDEX "client_requirements_clientId_key" ON "client_requirements"("clientId");

-- CreateIndex
CREATE INDEX "activity_logs_tenantId_clientId_createdAt_idx" ON "activity_logs"("tenantId", "clientId", "createdAt");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_requirements" ADD CONSTRAINT "client_requirements_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
