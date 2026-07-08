import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

import type {
  CreateAcademyLeadDto,
  CreateAcademyProgramDto,
  CreateAcademyStudentDto,
  PortalAccessDto,
  UpdateAcademyProgramDto,
} from './dto/academy.dto';

@Injectable()
export class AcademyService {
  constructor(private readonly prisma: PrismaService) {}

  async publicPrograms() {
    const tenant = await this.getPublicTenant();
    return this.prisma.academyProgram.findMany({
      where: { tenantId: tenant.id, status: 'OPEN' },
      orderBy: [{ startsAt: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async createPublicLead(dto: CreateAcademyLeadDto) {
    const tenant = await this.getPublicTenant();
    const lead = await this.prisma.academyLead.create({
      data: {
        tenantId: tenant.id,
        programId: dto.programId,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName?.trim() || null,
        phone: dto.phone.trim(),
        email: dto.email || null,
        formatInterest: dto.formatInterest,
        experienceLevel: dto.experienceLevel || null,
        objective: dto.objective || null,
        source: dto.source || 'Landing Academia FV',
      },
    });
    return { id: lead.id, message: 'Interes recibido. Faviola te contactara pronto.' };
  }

  async dashboard(tenantId: string) {
    const [programs, recentLeads, students, leads, newLeads] = await this.prisma.$transaction([
      this.prisma.academyProgram.findMany({
        where: { tenantId },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        include: { _count: { select: { leads: true, enrollments: true } } },
      }),
      this.prisma.academyLead.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 25,
        include: { program: { select: { title: true, format: true } } },
      }),
      this.prisma.academyStudent.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 25,
        include: {
          enrollments: {
            include: { program: { select: { id: true, title: true, format: true } } },
          },
        },
      }),
      this.prisma.academyLead.count({ where: { tenantId } }),
      this.prisma.academyLead.count({ where: { tenantId, status: 'NEW' } }),
    ]);

    return {
      programs,
      recentLeads,
      students,
      summary: {
        programs: programs.length,
        openPrograms: programs.filter((program) => program.status === 'OPEN').length,
        students: students.length,
        leads,
        newLeads,
      },
    };
  }

  async createProgram(tenantId: string, dto: CreateAcademyProgramDto) {
    return this.prisma.academyProgram.create({
      data: {
        tenantId,
        ...dto,
        description: dto.description || null,
        audience: dto.audience || null,
        duration: dto.duration || null,
      },
    });
  }

  async updateProgram(tenantId: string, id: string, dto: UpdateAcademyProgramDto) {
    const program = await this.prisma.academyProgram.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!program) throw new NotFoundException('Programa no encontrado');

    return this.prisma.academyProgram.update({
      where: { id },
      data: {
        ...dto,
        description: dto.description === undefined ? undefined : dto.description || null,
        audience: dto.audience === undefined ? undefined : dto.audience || null,
        duration: dto.duration === undefined ? undefined : dto.duration || null,
      },
      include: { _count: { select: { leads: true, enrollments: true } } },
    });
  }

  async createStudent(tenantId: string, dto: CreateAcademyStudentDto) {
    const student = await this.prisma.academyStudent.upsert({
      where: { tenantId_email: { tenantId, email: dto.email.toLowerCase().trim() } },
      update: {
        firstName: dto.firstName.trim(),
        lastName: dto.lastName?.trim() || null,
        phone: dto.phone?.trim() || null,
        accessCode: dto.accessCode.trim(),
        notes: dto.notes || null,
        status: 'ACTIVE',
      },
      create: {
        tenantId,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName?.trim() || null,
        phone: dto.phone?.trim() || null,
        email: dto.email.toLowerCase().trim(),
        accessCode: dto.accessCode.trim(),
        notes: dto.notes || null,
      },
    });

    if (dto.programIds.length > 0) {
      await this.prisma.academyEnrollment.createMany({
        data: dto.programIds.map((programId) => ({ tenantId, studentId: student.id, programId })),
        skipDuplicates: true,
      });
    }

    return this.prisma.academyStudent.findUnique({
      where: { id: student.id },
      include: { enrollments: { include: { program: true } } },
    });
  }

  async portal(dto: PortalAccessDto) {
    const tenant = await this.getPublicTenant();
    const student = await this.prisma.academyStudent.findFirst({
      where: {
        tenantId: tenant.id,
        email: dto.email.toLowerCase().trim(),
        accessCode: dto.accessCode.trim(),
        status: 'ACTIVE',
      },
      include: {
        enrollments: {
          include: { program: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!student) throw new UnauthorizedException('Correo o codigo incorrecto');

    return {
      student: {
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
      },
      programs: student.enrollments.map((enrollment) => enrollment.program),
    };
  }

  private async getPublicTenant() {
    const tenant = await this.prisma.tenant.findFirst({
      where: { slug: 'faviola-velarde', deletedAt: null },
      select: { id: true },
    });
    if (!tenant) throw new NotFoundException('Academia no disponible');
    return tenant;
  }
}
