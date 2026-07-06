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

  console.log('Seed completado.');
  console.log(`  Tenant:   ${tenant.name} (${tenant.slug})`);
  console.log(`  Roles:    ${Object.keys(ROLE_PERMISSIONS).join(', ')}`);
  console.log(`  Permisos: ${ALL.length}`);
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
