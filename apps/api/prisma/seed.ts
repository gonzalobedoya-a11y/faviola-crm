import { hash } from '@node-rs/argon2';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Catálogo de permisos (recurso.acción) — Blueprint §6.2. */
const PERMISSIONS: Array<[string, string]> = [
  ['clients.read', 'Ver clientes'],
  ['clients.create', 'Crear clientes'],
  ['clients.update', 'Editar clientes'],
  ['clients.delete', 'Eliminar clientes'],
  ['properties.read', 'Ver propiedades'],
  ['properties.create', 'Crear propiedades'],
  ['properties.update', 'Editar propiedades'],
  ['properties.delete', 'Eliminar propiedades'],
  ['matching.read', 'Ver coincidencias'],
  ['matching.run', 'Ejecutar matching'],
  ['deals.read', 'Ver negociaciones'],
  ['deals.create', 'Crear negociaciones'],
  ['deals.update', 'Editar negociaciones'],
  ['deals.close', 'Cerrar operaciones'],
  ['visits.read', 'Ver visitas'],
  ['visits.create', 'Agendar visitas'],
  ['visits.update', 'Editar visitas'],
  ['documents.read', 'Ver documentos'],
  ['documents.create', 'Subir documentos'],
  ['documents.update', 'Editar documentos'],
  ['reports.read', 'Ver reportes'],
  ['academy.read', 'Ver Academia FV'],
  ['academy.create', 'Crear programas y alumnos de Academia FV'],
  ['academy.update', 'Editar Academia FV'],
  ['users.manage', 'Gestionar usuarios'],
  ['roles.manage', 'Gestionar roles'],
  ['settings.manage', 'Gestionar configuración'],
  ['integrations.manage', 'Gestionar integraciones'],
  ['ai.use', 'Usar el asistente IA'],
];

const ALL = PERMISSIONS.map(([code]) => code);

const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ALL,
  ASESOR: [
    'clients.read',
    'clients.create',
    'clients.update',
    'clients.delete',
    'properties.read',
    'properties.create',
    'properties.update',
    'properties.delete',
    'matching.read',
    'matching.run',
    'deals.read',
    'deals.create',
    'deals.update',
    'deals.close',
    'visits.read',
    'visits.create',
    'visits.update',
    'documents.read',
    'documents.create',
    'documents.update',
    'reports.read',
    'academy.read',
    'academy.create',
    'academy.update',
    'ai.use',
  ],
  ASISTENTE: [
    'clients.read',
    'clients.create',
    'clients.update',
    'properties.read',
    'matching.read',
    'visits.read',
    'visits.create',
    'visits.update',
    'documents.read',
    'documents.create',
    'documents.update',
    'academy.read',
    'academy.create',
    'academy.update',
    'ai.use',
  ],
};

async function main(): Promise<void> {
  // 1) Permisos (catálogo global)
  for (const [code, description] of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code },
      update: { description },
      create: { code, description },
    });
  }

  // 2) Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'faviola-velarde' },
    update: {},
    create: { name: 'Faviola Velarde', slug: 'faviola-velarde', plan: 'PRO' },
  });

  // 3) Roles + permisos
  const permissionsByCode = new Map(
    (await prisma.permission.findMany()).map((p) => [p.code, p.id]),
  );

  const roleIds: Record<string, string> = {};
  for (const [roleName, codes] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: roleName } },
      update: {},
      create: { tenantId: tenant.id, name: roleName, isSystem: true },
    });
    roleIds[roleName] = role.id;

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: codes
        .map((code) => permissionsByCode.get(code))
        .filter((id): id is string => Boolean(id))
        .map((permissionId) => ({ roleId: role.id, permissionId })),
      skipDuplicates: true,
    });
  }

  // 4) Usuaria administradora
  const email = process.env.SEED_ADMIN_EMAIL ?? 'faviola@faviolavelarde.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email } },
  });
  if (!existingAdmin) {
    const configuredPassword = process.env.SEED_ADMIN_PASSWORD;
    if (process.env.NODE_ENV === 'production' && !configuredPassword) {
      throw new Error('SEED_ADMIN_PASSWORD es obligatoria para crear el admin en producción');
    }
    const passwordHash = await hash(configuredPassword ?? 'Faviola2026!');
    await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email,
        passwordHash,
        firstName: 'Faviola',
        lastName: 'Velarde',
        roleId: roleIds.ADMIN,
        status: 'ACTIVE',
      },
    });
  }

  // 5) Programas base de Academia FV
  const starterPrograms = [
    {
      title: 'Taller práctico para vendedores inmobiliarios',
      format: 'WORKSHOP' as const,
      description:
        'Sesión aplicada para ordenar prospección, seguimiento y argumentos de venta con casos reales.',
      modality: 'En vivo',
      audience: 'Vendedores independientes y asesores que quieren mejorar cierre y seguimiento.',
      duration: '2 horas',
    },
    {
      title: 'Charla de captación inmobiliaria',
      format: 'TALK' as const,
      description:
        'Charla introductoria para aprender cómo captar propietarios, generar confianza y pedir referidos.',
      modality: 'Online o presencial',
      audience: 'Personas que quieren empezar o reactivar su cartera inmobiliaria.',
      duration: '60 minutos',
    },
    {
      title: 'Capacitación comercial para equipos',
      format: 'TRAINING' as const,
      description:
        'Programa para equipos de ventas: método, guiones, hábitos comerciales y seguimiento disciplinado.',
      modality: 'A medida',
      audience: 'Equipos comerciales, inmobiliarias y empresas con fuerza de ventas.',
      duration: 'Por definir',
    },
  ];

  for (const program of starterPrograms) {
    const existing = await prisma.academyProgram.findFirst({
      where: { tenantId: tenant.id, title: program.title },
    });
    if (!existing) {
      await prisma.academyProgram.create({
        data: { tenantId: tenant.id, ...program, status: 'OPEN' },
      });
    }
  }

  console.log('Seed completado.');
  console.log(`  Tenant:   ${tenant.name} (${tenant.slug})`);
  console.log(`  Roles:    ${Object.keys(ROLE_PERMISSIONS).join(', ')}`);
  console.log(`  Permisos: ${ALL.length}`);
  console.log(`  Academia: ${starterPrograms.length} programas base`);
  console.log(`  Admin:    ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
