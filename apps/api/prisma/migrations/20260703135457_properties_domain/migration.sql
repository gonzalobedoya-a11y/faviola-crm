-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'OFF');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'DOC', 'VIDEO');

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "operation" "Operation" NOT NULL DEFAULT 'SALE',
    "propertyType" TEXT,
    "status" "PropertyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "area" INTEGER,
    "builtArea" INTEGER,
    "address" TEXT,
    "district" TEXT,
    "city" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "features" JSONB NOT NULL DEFAULT '{}',
    "ownerClientId" TEXT,
    "agentId" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_media" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "type" "MediaType" NOT NULL DEFAULT 'IMAGE',
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "properties_tenantId_status_idx" ON "properties"("tenantId", "status");

-- CreateIndex
CREATE INDEX "properties_tenantId_operation_price_idx" ON "properties"("tenantId", "operation", "price");

-- CreateIndex
CREATE INDEX "properties_tenantId_district_idx" ON "properties"("tenantId", "district");

-- CreateIndex
CREATE UNIQUE INDEX "properties_tenantId_code_key" ON "properties"("tenantId", "code");

-- CreateIndex
CREATE INDEX "property_media_propertyId_idx" ON "property_media"("propertyId");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_ownerClientId_fkey" FOREIGN KEY ("ownerClientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_media" ADD CONSTRAINT "property_media_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
