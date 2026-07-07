'use client';

import {
  BookOpenCheck,
  CheckCircle2,
  GraduationCap,
  LoaderCircle,
  LockKeyhole,
  MessageCircle,
  Send,
  UsersRound,
} from 'lucide-react';
import { useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  useAcademyPortalAccess,
  useCreateAcademyLead,
  usePublicAcademyPrograms,
} from '@/features/academy/api';
import type { AcademyFormat, AcademyPortalResult } from '@/features/academy/types';

const formatLabel: Record<AcademyFormat, string> = {
  WORKSHOP: 'Taller',
  TALK: 'Charla',
  TRAINING: 'Capacitacion',
};

function academyWhatsAppUrl(form?: HTMLFormElement): string {
  const data = form ? new FormData(form) : null;
  const name = data ? String(data.get('firstName') ?? '').trim() : '';
  const interest = data ? String(data.get('formatInterest') ?? '').trim() : '';
  const objective = data ? String(data.get('objective') ?? '').trim() : '';
  const text = [
    'Hola Faviola, quiero informacion sobre Academia FV.',
    name ? `Mi nombre es ${name}.` : '',
    interest ? `Me interesa: ${formatLabel[interest as AcademyFormat] ?? interest}.` : '',
    objective ? `Objetivo: ${objective}` : '',
  ]
    .filter(Boolean)
    .join('\n');
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export default function AcademyPublicPage(): ReactNode {
  const { data: programs = [], isLoading } = usePublicAcademyPrograms();
  const createLead = useCreateAcademyLead();
  const portalAccess = useAcademyPortalAccess();
  const [sent, setSent] = useState(false);
  const [portal, setPortal] = useState<AcademyPortalResult | null>(null);

  const submitLead = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      firstName: String(data.get('firstName') ?? '').trim(),
      lastName: String(data.get('lastName') ?? '').trim() || undefined,
      phone: String(data.get('phone') ?? '').trim(),
      email: String(data.get('email') ?? '').trim() || undefined,
      programId: String(data.get('programId') ?? '') || undefined,
      formatInterest: (String(data.get('formatInterest') ?? '') || undefined) as
        AcademyFormat | undefined,
      experienceLevel: String(data.get('experienceLevel') ?? '').trim() || undefined,
      objective: String(data.get('objective') ?? '').trim() || undefined,
      source: 'Landing Academia FV',
    };
    await createLead.mutateAsync(payload);
    setSent(true);
    window.open(academyWhatsAppUrl(form), '_blank', 'noopener,noreferrer');
    form.reset();
  };

  const submitPortal = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = await portalAccess.mutateAsync({
      email: String(data.get('email') ?? '').trim(),
      accessCode: String(data.get('accessCode') ?? '').trim(),
    });
    setPortal(result);
  };

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#241f1a]">
      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:py-12">
        <aside className="space-y-6">
          <div>
            <p className="font-script text-4xl text-[#a77934]">Academia FV</p>
            <h1 className="mt-4 font-display text-4xl leading-tight md:text-6xl">
              Talleres, charlas y capacitaciones para vendedores
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#665c51]">
              Formacion comercial con enfoque practico para vendedores inmobiliarios, equipos y
              personas que quieren ordenar su prospeccion, captacion y cierre.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Signal icon={<BookOpenCheck className="h-5 w-5" />} label="Metodo practico" />
            <Signal icon={<UsersRound className="h-5 w-5" />} label="Para equipos" />
            <Signal icon={<GraduationCap className="h-5 w-5" />} label="Acceso por codigo" />
          </div>

          <div className="rounded-2xl border border-[#e5d8c5] bg-white p-5 shadow-[0_18px_60px_rgba(36,31,26,0.08)]">
            <h2 className="font-display text-2xl">Programas sugeridos</h2>
            <div className="mt-4 grid gap-3">
              {isLoading ? (
                <p className="text-sm text-[#7a6f64]">Cargando programas...</p>
              ) : (
                programs.map((program) => (
                  <article key={program.id} className="rounded-xl border border-[#eadfce] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#241f1a] px-2 py-1 text-[11px] font-medium text-white">
                        {formatLabel[program.format]}
                      </span>
                      <span className="text-xs text-[#7a6f64]">{program.modality}</span>
                    </div>
                    <h3 className="mt-3 text-sm font-semibold">{program.title}</h3>
                    <p className="mt-2 text-xs leading-5 text-[#665c51]">{program.description}</p>
                  </article>
                ))
              )}
            </div>
          </div>
        </aside>

        <div className="space-y-5">
          <form
            onSubmit={(event) => void submitLead(event)}
            className="rounded-2xl border border-[#e5d8c5] bg-white p-6 shadow-[0_18px_60px_rgba(36,31,26,0.1)]"
          >
            <h2 className="font-display text-2xl">Quiero informacion</h2>
            {sent && (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                <CheckCircle2 className="mb-1 h-4 w-4" />
                Listo. El lead quedo registrado y se abrio WhatsApp para continuar.
              </div>
            )}
            {createLead.isError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                No pudimos registrar tus datos. Intenta nuevamente.
              </div>
            )}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Nombre" name="firstName" required />
              <Field label="Apellido" name="lastName" />
              <Field label="WhatsApp" name="phone" required />
              <Field label="Correo" name="email" type="email" />
              <label className="space-y-1 text-sm font-medium">
                Interes
                <select name="formatInterest" className={inputClass} defaultValue="WORKSHOP">
                  <option value="WORKSHOP">Taller practico</option>
                  <option value="TALK">Charla</option>
                  <option value="TRAINING">Capacitacion para equipo</option>
                </select>
              </label>
              <label className="space-y-1 text-sm font-medium">
                Programa
                <select name="programId" className={inputClass} defaultValue="">
                  <option value="">Por definir</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.title}
                    </option>
                  ))}
                </select>
              </label>
              <Field
                label="Experiencia"
                name="experienceLevel"
                placeholder="Nueva, intermedia..."
              />
            </div>
            <label className="mt-4 block space-y-1 text-sm font-medium">
              Objetivo
              <textarea
                name="objective"
                rows={4}
                placeholder="Ej. Quiero captar mas propietarios, mejorar cierres o entrenar a mi equipo."
                className={`${inputClass} h-auto py-3`}
              />
            </label>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button type="submit" variant="brand" size="lg" disabled={createLead.isPending}>
                {createLead.isPending ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
                Enviar y abrir WhatsApp
              </Button>
              <Button asChild variant="secondary" size="lg">
                <a href={academyWhatsAppUrl()} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-5 w-5" />
                  Solo WhatsApp
                </a>
              </Button>
            </div>
          </form>

          <form
            onSubmit={(event) => void submitPortal(event)}
            className="rounded-2xl border border-[#e5d8c5] bg-white p-6"
          >
            <div className="flex items-center gap-2">
              <LockKeyhole className="h-5 w-5 text-[#a77934]" />
              <h2 className="font-display text-2xl">Acceso alumnos</h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_0.75fr_auto]">
              <Field label="Correo" name="email" type="email" required />
              <Field label="Codigo" name="accessCode" required />
              <Button className="self-end" type="submit" disabled={portalAccess.isPending}>
                Entrar
              </Button>
            </div>
            {portalAccess.isError && (
              <p className="mt-3 text-sm text-red-700">Correo o codigo incorrecto.</p>
            )}
            {portal && (
              <div className="mt-4 rounded-xl border border-[#eadfce] bg-[#fffaf3] p-4">
                <p className="text-sm font-medium">
                  Bienvenida, {portal.student.firstName}. Programas activos:
                </p>
                <ul className="mt-2 grid gap-2 text-sm text-[#665c51]">
                  {portal.programs.map((program) => (
                    <li key={program.id}>{program.title}</li>
                  ))}
                  {portal.programs.length === 0 && <li>Aun no tienes programas asignados.</li>}
                </ul>
              </div>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}

const inputClass =
  'h-11 w-full rounded-xl border border-[#eadfce] bg-white px-3 text-sm outline-none focus:border-[#a9884e] focus:ring-2 focus:ring-[#a9884e]/20';

function Field({
  label,
  name,
  type = 'text',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
}): ReactNode {
  return (
    <label className="space-y-1 text-sm font-medium">
      {label}
      <input name={name} type={type} className={inputClass} {...props} />
    </label>
  );
}

function Signal({ icon, label }: { icon: ReactNode; label: string }): ReactNode {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[#e5d8c5] bg-white px-4 py-3 text-sm font-medium">
      <span className="text-[#a77934]">{icon}</span>
      {label}
    </div>
  );
}
