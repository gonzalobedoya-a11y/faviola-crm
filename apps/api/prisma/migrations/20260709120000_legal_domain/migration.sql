-- CreateEnum
CREATE TYPE "LegalDocType" AS ENUM ('TITULO_DOMINIO', 'PARTIDA', 'DNI', 'ESTUDIO_TITULO', 'CORRETAJE', 'OTROS');

-- CreateTable
CREATE TABLE "property_legal" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "contract" TEXT NOT NULL DEFAULT 'EXCLUSIVO',
    "corretajeExpiry" TIMESTAMP(3),
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_legal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_documents" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "type" "LegalDocType" NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "property_legal_propertyId_key" ON "property_legal"("propertyId");

-- CreateIndex
CREATE INDEX "property_legal_tenantId_idx" ON "property_legal"("tenantId");

-- CreateIndex
CREATE INDEX "property_documents_tenantId_propertyId_idx" ON "property_documents"("tenantId", "propertyId");

-- AddForeignKey
ALTER TABLE "property_legal" ADD CONSTRAINT "property_legal_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_documents" ADD CONSTRAINT "property_documents_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

