'use client';

import {
  BookOpenCheck,
  Copy,
  GraduationCap,
  LoaderCircle,
  Plus,
  UserRoundPlus,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAcademyDashboard, useCreateAcademyStudent } from '@/features/academy/api';
import type { AcademyFormat, AcademyLeadStatus } from '@/features/academy/types';

const formatLabel: Record<AcademyFormat, string> = {
  WORKSHOP: 'Taller',
  TALK: 'Charla',
  TRAINING: 'Capacitacion',
};

const statusClass: Record<AcademyLeadStatus, string> = {
  NEW: 'border-amber-200 bg-amber-50 text-amber-700',
  CONTACTED: 'border-blue-200 bg-blue-50 text-blue-700',
  ENROLLED: 'border-green-200 bg-green-50 text-green-700',
  DISCARDED: 'border-slate-200 bg-slate-50 text-slate-600',
};

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

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-deep">Academia FV</p>
          <h1 className="font-display text-3xl text-content">Escuela comercial</h1>
          <p className="mt-1 text-sm text-content-muted">
            Leads, programas y acceso simple para alumnos con email y codigo.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/academia" target="_blank">
            <GraduationCap className="h-4 w-4" />
            Ver landing
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Metric label="Leads" value={data.summary.leads} />
        <Metric label="Nuevos" value={data.summary.newLeads} />
        <Metric label="Programas" value={data.summary.programs} />
        <Metric label="Alumnos" value={data.summary.students} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-4">
          <div className="rounded-xl border border-border bg-surface-raised shadow-elevation-1">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="font-display text-2xl text-content">Leads academicos</h2>
                <p className="text-sm text-content-muted">Contactos que llegan desde /academia.</p>
              </div>
            </div>
            <div className="divide-y divide-border">
              {data.recentLeads.length === 0 ? (
                <Empty label="Aun no hay leads academicos." />
              ) : (
                data.recentLeads.map((lead) => (
                  <article key={lead.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-content">
                        {lead.firstName} {lead.lastName}
                      </p>
                      <Badge className={statusClass[lead.status]}>{lead.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-content-muted">
                      {lead.phone}
                      {lead.email ? ` · ${lead.email}` : ''}
                    </p>
                    <p className="mt-2 text-sm text-content-secondary">
                      {lead.objective || 'Sin objetivo detallado'}
                    </p>
                    <p className="mt-2 text-xs text-content-muted">
                      {lead.program?.title ??
                        (lead.formatInterest
                          ? formatLabel[lead.formatInterest]
                          : 'Interes por definir')}
                    </p>
                  </article>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
            <h2 className="font-display text-2xl text-content">Programas base</h2>
            <div className="mt-4 grid gap-3">
              {data.programs.map((program) => (
                <article key={program.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border-brand/30 bg-brand-tint text-brand-deep">
                      {formatLabel[program.format]}
                    </Badge>
                    <span className="text-xs text-content-muted">{program.modality}</span>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-content">{program.title}</h3>
                  <p className="mt-1 text-sm text-content-muted">{program.description}</p>
                  <p className="mt-2 text-xs text-content-muted">
                    {program._count?.leads ?? 0} leads · {program._count?.enrollments ?? 0} alumnos
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <form
            onSubmit={(event) => void submitStudent(event)}
            className="rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1"
          >
            <div className="flex items-center gap-2">
              <UserRoundPlus className="h-5 w-5 text-brand-deep" />
              <h2 className="font-display text-2xl text-content">Crear alumno</h2>
            </div>
            <div className="mt-4 grid gap-3">
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
                  className="min-h-28 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-content"
                >
                  {data.programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm font-medium text-content">
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
            <div className="flex items-center gap-2">
              <BookOpenCheck className="h-5 w-5 text-brand-deep" />
              <h2 className="font-display text-2xl text-content">Alumnos recientes</h2>
            </div>
            <div className="mt-4 divide-y divide-border">
              {data.students.length === 0 ? (
                <Empty label="Aun no hay alumnos creados." />
              ) : (
                data.students.map((student) => (
                  <div key={student.id} className="py-3">
                    <p className="text-sm font-medium text-content">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-xs text-content-muted">{student.email}</p>
                    <button
                      type="button"
                      onClick={() => void navigator.clipboard.writeText(student.accessCode)}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-deep"
                    >
                      <Copy className="h-3 w-3" />
                      Codigo {student.accessCode}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }): ReactNode {
  return (
    <div className="rounded-xl border border-border bg-surface-raised p-4 shadow-elevation-1">
      <p className="text-xs uppercase tracking-wide text-content-muted">{label}</p>
      <p className="mt-2 font-display text-3xl text-content">{value}</p>
    </div>
  );
}

function Empty({ label }: { label: string }): ReactNode {
  return <p className="p-5 text-sm text-content-muted">{label}</p>;
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
