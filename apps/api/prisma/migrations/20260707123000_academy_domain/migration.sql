CREATE TYPE "AcademyFormat" AS ENUM ('WORKSHOP', 'TALK', 'TRAINING');
CREATE TYPE "AcademyProgramStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');
CREATE TYPE "AcademyLeadStatus" AS ENUM ('NEW', 'CONTACTED', 'ENROLLED', 'DISCARDED');
CREATE TYPE "AcademyStudentStatus" AS ENUM ('ACTIVE', 'PAUSED');

CREATE TABLE "academy_programs" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "format" "AcademyFormat" NOT NULL,
  "description" TEXT,
  "modality" TEXT NOT NULL DEFAULT 'En vivo',
  "audience" TEXT,
  "startsAt" TIMESTAMP(3),
  "duration" TEXT,
  "capacity" INTEGER,
  "status" "AcademyProgramStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "academy_programs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "academy_leads" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "programId" TEXT,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "formatInterest" "AcademyFormat",
  "experienceLevel" TEXT,
  "objective" TEXT,
  "source" TEXT NOT NULL DEFAULT 'Landing Academia FV',
  "status" "AcademyLeadStatus" NOT NULL DEFAULT 'NEW',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "academy_leads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "academy_students" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT,
  "phone" TEXT,
  "email" TEXT NOT NULL,
  "accessCode" TEXT NOT NULL,
  "status" "AcademyStudentStatus" NOT NULL DEFAULT 'ACTIVE',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "academy_students_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "academy_enrollments" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "programId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "academy_enrollments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "academy_programs_tenantId_status_idx" ON "academy_programs"("tenantId", "status");
CREATE INDEX "academy_programs_tenantId_format_idx" ON "academy_programs"("tenantId", "format");
CREATE INDEX "academy_leads_tenantId_status_idx" ON "academy_leads"("tenantId", "status");
CREATE INDEX "academy_leads_tenantId_createdAt_idx" ON "academy_leads"("tenantId", "createdAt");
CREATE UNIQUE INDEX "academy_students_tenantId_email_key" ON "academy_students"("tenantId", "email");
CREATE INDEX "academy_students_tenantId_status_idx" ON "academy_students"("tenantId", "status");
CREATE UNIQUE INDEX "academy_enrollments_studentId_programId_key" ON "academy_enrollments"("studentId", "programId");
CREATE INDEX "academy_enrollments_tenantId_programId_idx" ON "academy_enrollments"("tenantId", "programId");

ALTER TABLE "academy_programs" ADD CONSTRAINT "academy_programs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "academy_leads" ADD CONSTRAINT "academy_leads_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "academy_leads" ADD CONSTRAINT "academy_leads_programId_fkey" FOREIGN KEY ("programId") REFERENCES "academy_programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "academy_students" ADD CONSTRAINT "academy_students_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "academy_enrollments" ADD CONSTRAINT "academy_enrollments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "academy_enrollments" ADD CONSTRAINT "academy_enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "academy_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "academy_enrollments" ADD CONSTRAINT "academy_enrollments_programId_fkey" FOREIGN KEY ("programId") REFERENCES "academy_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
