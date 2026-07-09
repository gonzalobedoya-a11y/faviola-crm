-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "propertyId" TEXT;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

