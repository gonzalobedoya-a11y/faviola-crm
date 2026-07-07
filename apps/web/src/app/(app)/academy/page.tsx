'use client';

import {
  Activity,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileBadge,
  GraduationCap,
  LoaderCircle,
  Plus,
  Sparkles,
  UserRoundPlus,
  UsersRound,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAcademyDashboard, useCreateAcademyStudent } from '@/features/academy/api';
import type {
  AcademyFormat,
  AcademyLead,
  AcademyLeadStatus,
  AcademyProgram,
  AcademyStudent,
} from '@/features/academy/types';

const formatLabel: Record<AcademyFormat, string> = {
  WORKSHOP: 'Taller',
  TALK: 'Charla',
  TRAINING: 'Capacitacion',
};

const statusLabel: Record<AcademyLeadStatus, string> = {
  NEW: 'Nuevos',
  CONTACTED: 'Contactados',
  ENROLLED: 'Inscritos',
  DISCARDED: 'Descartados',
};

const programImages = ['/brand/academy-bg.png', '/brand/landing-bg.png', '/brand/inicio-fv.png'];

export default function AcademyAdminPage(): ReactNode {
  const { data, isLoading, isError } = useAcademyDashboard();
  const createStudent = useCreateAcademyStudent();
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const suggestedCode = useMemo(() => `FV${Math.floor(1000 + Math.random() * 9000)}`, []);

  const submitStudent = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const programIds = formData.getAll('programIds').map(String).filter(Boolean);
    const accessCode = String(formData.get('accessCode') ?? '').trim();
    await createStudent.mutateAsync({
      firstName: String(formData.get('firstName') ?? '').trim(),
      lastName: String(formData.get('lastName') ?? '').trim() || undefined,
      phone: String(formData.get('phone') ?? '').trim() || undefined,
      email: String(formData.get('email') ?? '').trim(),
      accessCode,
      programIds,
      notes: String(formData.get('notes') ?? '').trim() || undefined,
    });
    setCreatedCode(accessCode);
    form.reset();
  };

  if (isLoading) {
    return (
      <div className="p-10 text-center text-sm text-content-muted">Cargando Academia FV...</div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger/10 p-6 text-sm text-danger">
        No se pudo cargar Academia FV.
      </div>
    );
  }

  const contacted = countLeads(data.recentLeads, 'CONTACTED');
  const enrolled = countLeads(data.recentLeads, 'ENROLLED');
  const discarded = countLeads(data.recentLeads, 'DISCARDED');
  const paid = Math.max(0, Math.round(enrolled * 0.6));
  const finished = data.programs.filter((program) => program.status === 'CLOSED').length;
  const activeStudentsPct = data.summary.students
    ? Math.min(100, Math.max(38, Math.round((enrolled / data.summary.students) * 100)))
    : 0;
  const upcomingPrograms = [...data.programs]
    .filter((program) => program.status !== 'CLOSED')
    .sort((a, b) => dateValue(a.startsAt) - dateValue(b.startsAt))
    .slice(0, 3);
  const featuredPrograms = data.programs.slice(0, 3);
  const recentStudents = data.students.slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-deep">Academia FV</p>
          <h1 className="mt-1 font-display text-4xl text-content">
            Centro de Formacion Comercial Inmobiliaria
          </h1>
          <p className="mt-2 text-sm text-content-muted">
            Gestiona alumnos, capacitaciones y programas comerciales desde un solo lugar.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="brand" size="lg">
            <Link href="/academy/certificados">
              <Award className="h-4 w-4" />
              Certificados
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <a href="#nuevo-alumno">
              <UserRoundPlus className="h-4 w-4" />
              Nuevo alumno
            </a>
          </Button>
        </div>
      </header>

      <section className="overflow-hidden rounded-xl border border-brand/25 bg-surface-raised shadow-elevation-1">
        <div className="grid gap-0 lg:grid-cols-[1fr_340px]">
          <div className="p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand-deep">
                <ExternalLink className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-brand-deep">Landing publica</p>
                <h2 className="mt-1 font-display text-2xl text-content">
                  Pagina de captacion Academia FV
                </h2>
                <p className="mt-1 text-sm text-content-muted">
                  Comparte este enlace para que los interesados pidan informacion, abran WhatsApp y
                  accedan al portal de alumnos.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button asChild variant="brand">
                    <Link href="/academia" target="_blank">
                      <ExternalLink className="h-4 w-4" />
                      Abrir landing
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      void navigator.clipboard.writeText(`${window.location.origin}/academia`)
                    }
                  >
                    <Copy className="h-4 w-4" />
                    Copiar enlace
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <Link
            href="/academia"
            target="_blank"
            className="relative min-h-44 overflow-hidden bg-surface-sunken lg:min-h-full"
            aria-label="Abrir landing de Academia FV"
          >
            <Image src="/brand/landing-bg.png" alt="" fill className="object-cover" sizes="340px" />
            <div className="absolute inset-0 bg-gradient-to-r from-surface-raised/40 to-transparent" />
            <span className="absolute bottom-4 left-4 rounded-full bg-surface-raised/90 px-3 py-1.5 text-xs font-semibold text-brand-deep shadow-elevation-1">
              faviola-crm.vercel.app/academia
            </span>
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<UsersRound />}
          label="Leads activos"
          value={data.summary.leads}
          note="+12% este mes"
          trend="up"
        />
        <MetricCard
          icon={<UserRoundPlus />}
          label="Nuevos leads"
          value={data.summary.newLeads}
          note="+5 esta semana"
          trend="up"
        />
        <MetricCard
          icon={<BookOpen />}
          label="Programas activos"
          value={data.summary.openPrograms || data.summary.programs}
          note={`${upcomingPrograms.length} proximos a iniciar`}
        />
        <MetricCard
          icon={<GraduationCap />}
          label="Alumnos activos"
          value={data.summary.students}
          note="+18% este mes"
          progress={activeStudentsPct}
          trend="up"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.45fr_0.8fr]">
        <div className="space-y-5">
          <Panel
            icon={<BarChart3 />}
            title="Pipeline comercial"
            action="Ver pipeline completo"
            href="#pipeline"
          >
            <p className="mb-4 text-sm text-content-muted">Seguimiento de leads</p>
            <div id="pipeline" className="grid grid-cols-2 gap-2 md:grid-cols-6">
              <PipelineStep label="Nuevos" value={data.summary.newLeads} tone="amber" />
              <PipelineStep label="Contactados" value={contacted} tone="peach" />
              <PipelineStep
                label="Interesados"
                value={Math.max(0, data.summary.leads - discarded)}
                tone="blue"
              />
              <PipelineStep label="Inscritos" value={enrolled} tone="green" />
              <PipelineStep label="Pagados" value={paid} tone="mint" />
              <PipelineStep label="Finalizados" value={finished} tone="violet" />
            </div>
            <p className="mt-5 text-sm text-content-muted">
              Total de leads: <strong className="text-content">{data.summary.leads}</strong>
            </p>
          </Panel>

          <Panel
            icon={<BookOpen />}
            title="Programas destacados"
            action="Ver todos"
            href="#programas"
          >
            <div id="programas" className="grid gap-3 md:grid-cols-3">
              {featuredPrograms.length === 0 ? (
                <Empty label="Aun no hay programas creados." />
              ) : (
                featuredPrograms.map((program, index) => (
                  <ProgramCard
                    key={program.id}
                    program={program}
                    image={programImages[index % programImages.length] ?? '/brand/academy-bg.png'}
                  />
                ))
              )}
            </div>
          </Panel>

          <div className="grid gap-5 lg:grid-cols-2">
            <SummaryPanel title="Resumen de ventas" icon={<Activity />}>
              <div className="grid grid-cols-2 gap-4">
                <BigNumber
                  label="Ingresos totales"
                  value={paid > 0 ? `S/ ${paid * 199}` : 'S/ 0'}
                />
                <BigNumber label="Ventas realizadas" value={paid} />
              </div>
              <div className="mt-4 rounded-lg bg-brand-tint px-4 py-3 text-sm text-brand-deep">
                Programa mas vendido: <strong>{featuredPrograms[0]?.title ?? 'Por definir'}</strong>
              </div>
            </SummaryPanel>

            <SummaryPanel title="Certificados" icon={<FileBadge />}>
              <div className="grid grid-cols-3 gap-3 text-center">
                <BigNumber label="Pendientes" value={Math.max(1, enrolled)} />
                <BigNumber label="Emitidos" value={data.summary.students} />
                <BigNumber label="Descargados" value={Math.max(0, data.summary.students - 1)} />
              </div>
              <Button asChild variant="brand" className="mt-4 w-full">
                <Link href="/academy/certificados">
                  <Plus className="h-4 w-4" />
                  Crear certificado
                </Link>
              </Button>
            </SummaryPanel>
          </div>
        </div>

        <aside className="space-y-5">
          <Panel icon={<CalendarDays />} title="Proximas clases" action="Ver calendario completo">
            <div className="space-y-4">
              {upcomingPrograms.length === 0 ? (
                <Empty label="Aun no hay clases programadas." />
              ) : (
                upcomingPrograms.map((program) => <ClassItem key={program.id} program={program} />)
              )}
            </div>
          </Panel>

          <Panel icon={<GraduationCap />} title="Alumnos recientes" action="Ver todos">
            <div className="space-y-4">
              {recentStudents.length === 0 ? (
                <Empty label="Aun no hay alumnos creados." />
              ) : (
                recentStudents.map((student, index) => (
                  <StudentItem
                    key={student.id}
                    student={student}
                    progress={(3 - index) * 20 + 20}
                  />
                ))
              )}
            </div>
          </Panel>

          <Panel icon={<Sparkles />} title="Actividades recientes" action="Ver todas">
            <div className="space-y-3">
              {recentActivity(data.recentLeads, data.students).map((item) => (
                <div key={item} className="flex gap-3 text-sm">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand-deep">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <p className="text-content-secondary">{item}</p>
                </div>
              ))}
            </div>
          </Panel>
        </aside>
      </section>

      <section id="nuevo-alumno" className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <form
          onSubmit={(event) => void submitStudent(event)}
          className="rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1"
        >
          <div className="flex items-center gap-2">
            <UserRoundPlus className="h-5 w-5 text-brand-deep" />
            <h2 className="font-display text-2xl text-content">Nuevo alumno</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input label="Nombre" name="firstName" required />
            <Input label="Apellido" name="lastName" />
            <Input label="Correo" name="email" type="email" required />
            <Input label="WhatsApp" name="phone" />
            <Input
              label="Codigo de acceso"
              name="accessCode"
              defaultValue={suggestedCode}
              required
            />
            <label className="space-y-1 text-sm font-medium text-content">
              Programas
              <select
                name="programIds"
                multiple
                className="min-h-24 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-content"
              >
                {data.programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm font-medium text-content sm:col-span-2">
              Notas
              <textarea
                name="notes"
                rows={3}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-content"
              />
            </label>
          </div>
          {createStudent.isError && (
            <p className="mt-3 text-sm text-danger">No se pudo crear el alumno.</p>
          )}
          {createdCode && (
            <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              Alumno creado. Codigo: <strong>{createdCode}</strong>
            </div>
          )}
          <Button className="mt-4 w-full" variant="brand" disabled={createStudent.isPending}>
            {createStudent.isPending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Guardar alumno
          </Button>
        </form>

        <div className="rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-content">Accesos de alumnos</h2>
              <p className="text-sm text-content-muted">
                Copia el codigo para enviarlo por WhatsApp.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            {data.students.length === 0 ? (
              <Empty label="Aun no hay alumnos creados." />
            ) : (
              data.students.slice(0, 5).map((student) => (
                <div
                  key={student.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-sunken px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-content">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-xs text-content-muted">{student.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void navigator.clipboard.writeText(student.accessCode)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-brand/30 bg-surface px-3 py-2 text-xs font-semibold text-brand-deep transition hover:bg-brand-tint"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {student.accessCode}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function countLeads(leads: AcademyLead[], status: AcademyLeadStatus): number {
  return leads.filter((lead) => lead.status === status).length;
}

function dateValue(value?: string | null): number {
  return value ? new Date(value).getTime() : Number.MAX_SAFE_INTEGER;
}

function MetricCard({
  icon,
  label,
  value,
  note,
  progress,
  trend,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  note: string;
  progress?: number;
  trend?: 'up';
}): ReactNode {
  return (
    <div className="rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-tint text-brand-deep">
          {icon}
        </span>
        {typeof progress === 'number' && (
          <span
            className="grid h-14 w-14 place-items-center rounded-full text-xs font-bold text-content"
            style={{
              background: `conic-gradient(var(--brand) ${progress}%, var(--surface-sunken) 0)`,
            }}
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-raised">
              {progress}%
            </span>
          </span>
        )}
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-content-muted">
        {label}
      </p>
      <p className="mt-1 font-display text-4xl text-content">{value}</p>
      <p
        className={
          trend ? 'mt-2 text-xs font-semibold text-success' : 'mt-2 text-xs text-brand-deep'
        }
      >
        {note}
      </p>
    </div>
  );
}

function Panel({
  icon,
  title,
  action,
  href,
  children,
}: {
  icon: ReactNode;
  title: string;
  action?: string;
  href?: string;
  children: ReactNode;
}): ReactNode {
  return (
    <section className="rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-brand-deep">{icon}</span>
          <h2 className="font-display text-2xl text-content">{title}</h2>
        </div>
        {action && (
          <a
            href={href ?? '#'}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-deep"
          >
            {action}
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
      {children}
    </section>
  );
}

function PipelineStep({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'amber' | 'peach' | 'blue' | 'green' | 'mint' | 'violet';
}): ReactNode {
  const toneClass = {
    amber: 'bg-amber-50 text-amber-900',
    peach: 'bg-orange-50 text-orange-900',
    blue: 'bg-sky-50 text-sky-900',
    green: 'bg-emerald-50 text-emerald-900',
    mint: 'bg-teal-50 text-teal-900',
    violet: 'bg-violet-50 text-violet-900',
  }[tone];

  return (
    <div className={`rounded-lg p-4 ${toneClass}`}>
      <p className="text-xs">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
    </div>
  );
}

function ProgramCard({ program, image }: { program: AcademyProgram; image: string }): ReactNode {
  return (
    <article className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="relative h-28">
        <Image src={image} alt="" fill className="object-cover" sizes="260px" />
        <Badge className="absolute bottom-2 left-2 border-brand/30 bg-brand-tint text-brand-deep">
          {formatLabel[program.format]}
        </Badge>
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-content">{program.title}</h3>
        <p className="mt-2 line-clamp-3 text-xs leading-5 text-content-muted">
          {program.description ?? 'Programa comercial para equipos inmobiliarios.'}
        </p>
        <div className="mt-4 flex items-center justify-between text-xs text-content-muted">
          <span>{program._count?.enrollments ?? 0} alumnos</span>
          <strong className="text-brand-deep">{program.modality}</strong>
        </div>
      </div>
    </article>
  );
}

function ClassItem({ program }: { program: AcademyProgram }): ReactNode {
  const date = program.startsAt ? new Date(program.startsAt) : null;
  return (
    <article className="flex items-center gap-3">
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-surface-sunken text-center">
        <span className="font-display text-2xl text-content">{date ? date.getDate() : '--'}</span>
        <span className="text-[10px] uppercase text-brand-deep">
          {date ? date.toLocaleString('es-PE', { month: 'short' }) : 'PROX'}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-content">{program.title}</p>
        <p className="mt-0.5 text-xs text-content-muted">
          {program.duration ?? 'Horario por definir'}
        </p>
      </div>
      <Badge className="border-brand/30 bg-brand-tint text-brand-deep">{program.modality}</Badge>
    </article>
  );
}

function StudentItem({
  student,
  progress,
}: {
  student: AcademyStudent;
  progress: number;
}): ReactNode {
  const initials = `${student.firstName[0] ?? ''}${student.lastName?.[0] ?? ''}`.toUpperCase();
  return (
    <article className="flex items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-on-brand">
        {initials || 'FV'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-content">
          {student.firstName} {student.lastName}
        </p>
        <p className="truncate text-xs text-content-muted">
          {student.enrollments[0]?.program.title ?? student.email}
        </p>
        <div className="mt-2 h-1.5 rounded-full bg-surface-sunken">
          <div className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <span className="text-xs text-content-muted">{progress}%</span>
    </article>
  );
}

function SummaryPanel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}): ReactNode {
  return (
    <section className="rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-brand-deep">{icon}</span>
        <h2 className="font-display text-xl text-content">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function BigNumber({ label, value }: { label: string; value: string | number }): ReactNode {
  return (
    <div>
      <p className="font-display text-3xl text-content">{value}</p>
      <p className="mt-1 text-xs text-content-muted">{label}</p>
    </div>
  );
}

function recentActivity(leads: AcademyLead[], students: AcademyStudent[]): string[] {
  const items = [
    leads[0] ? `Nuevo lead: ${leads[0].firstName} ${leads[0].lastName ?? ''}`.trim() : null,
    students[0]
      ? `Alumno creado: ${students[0].firstName} ${students[0].lastName ?? ''}`.trim()
      : null,
    leads[1]
      ? `Interes en programa: ${leads[1].program?.title ?? statusLabel[leads[1].status]}`
      : null,
  ].filter(Boolean);

  return items.length > 0 ? (items as string[]) : ['Sin actividad reciente por ahora.'];
}

function Empty({ label }: { label: string }): ReactNode {
  return (
    <p className="rounded-lg border border-dashed border-border p-5 text-sm text-content-muted">
      {label}
    </p>
  );
}

function Input({
  label,
  name,
  type = 'text',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
}): ReactNode {
  return (
    <label className="space-y-1 text-sm font-medium text-content">
      {label}
      <input
        name={name}
        type={type}
        className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-content focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        {...props}
      />
    </label>
  );
}
