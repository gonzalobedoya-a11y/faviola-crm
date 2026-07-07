'use client';

import {
  BookOpenCheck,
  BriefcaseBusiness,
  CheckCircle2,
  LockKeyhole,
  LoaderCircle,
  Mail,
  MessageCircle,
  Phone,
  Send,
  User,
  UsersRound,
} from 'lucide-react';
import Image from 'next/image';
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

const WHATSAPP_NUMBER = '51986445884';

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
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export default function AcademyPublicPage(): ReactNode {
  const { data: programs = [], isLoading } = usePublicAcademyPrograms();
  const createLead = useCreateAcademyLead();
  const portalAccess = useAcademyPortalAccess();
  const [sent, setSent] = useState(false);
  const [portal, setPortal] = useState<AcademyPortalResult | null>(null);
  const featuredProgram = programs[0];

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
    <main className="relative min-h-screen overflow-hidden bg-[#f7f2ea] text-[#171512]">
      <Image
        src="/brand/academy-bg.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,252,247,0.96)_0%,rgba(255,252,247,0.82)_35%,rgba(255,252,247,0.52)_62%,rgba(255,252,247,0.2)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#f7f2ea] to-transparent" />

      <section className="relative z-10 mx-auto grid min-h-screen max-w-[1500px] gap-6 px-5 py-5 md:px-8 lg:grid-cols-[0.95fr_0.68fr_0.9fr] lg:items-center lg:px-12">
        <div className="max-w-2xl pt-8 lg:pt-0">
          <div className="flex items-center gap-5">
            <p className="font-script text-4xl text-[#a77934] md:text-5xl">Academia FV</p>
            <span className="h-px w-16 bg-[#a77934]" />
          </div>

          <h1 className="mt-7 max-w-2xl font-display text-5xl leading-[0.98] text-[#161412] md:text-7xl">
            Talleres, charlas y capacitaciones para{' '}
            <span className="text-[#9a7132]">vendedores</span>
          </h1>

          <span className="mt-7 block h-1 w-16 bg-[#a77934]" />

          <p className="mt-6 max-w-xl text-base leading-8 text-[#51483f] md:text-lg">
            Formacion comercial con enfoque practico para vendedores inmobiliarios, equipos y
            personas que quieren ordenar su prospeccion, captacion y cierre.
          </p>

          <div className="mt-7 grid max-w-xl gap-3 sm:grid-cols-3">
            <Signal icon={<BookOpenCheck className="h-5 w-5" />} label="Metodo practico" />
            <Signal icon={<UsersRound className="h-5 w-5" />} label="Para equipos" />
            <Signal icon={<LockKeyhole className="h-5 w-5" />} label="Acceso por codigo" />
          </div>

          <div className="mt-7 max-w-2xl rounded-xl border border-white/10 bg-[#17191a] p-5 text-white shadow-[0_24px_70px_rgba(23,25,26,0.22)]">
            <h2 className="font-display text-2xl">Programas sugeridos</h2>
            {isLoading ? (
              <p className="mt-4 text-sm text-white/70">Cargando programas...</p>
            ) : featuredProgram ? (
              <article className="mt-4 grid gap-4 sm:grid-cols-[168px_1fr]">
                <div className="relative min-h-32 overflow-hidden rounded-lg bg-[#2c2b28]">
                  <Image
                    src="/brand/academy-bg.png"
                    alt=""
                    fill
                    sizes="168px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-[#17191a]/25" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-md bg-[#b98a3b] px-3 py-1 text-xs font-semibold text-white">
                      {formatLabel[featuredProgram.format]}
                    </span>
                    <span className="text-sm text-white/75">{featuredProgram.modality}</span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{featuredProgram.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/72">
                    {featuredProgram.description}
                  </p>
                  <a
                    href="#lead-form"
                    className="mt-4 inline-flex items-center text-sm font-semibold text-[#d0a559]"
                  >
                    Ver mas programas
                  </a>
                </div>
              </article>
            ) : (
              <p className="mt-4 text-sm text-white/70">Pronto anunciaremos nuevos programas.</p>
            )}
          </div>
        </div>

        <div className="relative hidden min-h-[640px] overflow-hidden rounded-[32px] bg-white/20 shadow-[0_28px_80px_rgba(36,31,26,0.12)] lg:block">
          <Image
            src="/brand/academy-brand.png"
            alt="Faviola Velarde"
            fill
            priority
            sizes="420px"
            className="object-cover object-[56%_50%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#f7f2ea]/18 via-transparent to-transparent" />
        </div>

        <div className="space-y-5 pb-10 lg:pb-0">
          <form
            id="lead-form"
            onSubmit={(event) => void submitLead(event)}
            className="overflow-hidden rounded-[26px] border border-[#d9cbb7] bg-[#fffaf4]/95 shadow-[0_26px_80px_rgba(36,31,26,0.18)] backdrop-blur"
          >
            <div className="flex items-center gap-4 bg-[#17191a] px-6 py-4 text-white">
              <span className="relative flex h-12 w-12 shrink-0 overflow-hidden rounded-md border border-[#b98a3b]/70">
                <Image
                  src="/brand/logo-monogram.png"
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </span>
              <div>
                <p className="font-display text-2xl leading-none md:text-3xl">Quiero informacion</p>
                <p className="mt-1 text-xs uppercase text-[#d0a559]">Faviola Velarde</p>
              </div>
            </div>

            <div className="p-5">
              {sent && (
                <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                  <CheckCircle2 className="mb-1 h-4 w-4" />
                  Listo. El lead quedo registrado y se abrio WhatsApp para continuar.
                </div>
              )}
              {createLead.isError && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  No pudimos registrar tus datos. Intenta nuevamente.
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <Field icon={<User />} label="Nombre" name="firstName" required />
                <Field icon={<User />} label="Apellido" name="lastName" />
                <Field icon={<Phone />} label="WhatsApp" name="phone" required />
                <Field icon={<Mail />} label="Correo" name="email" type="email" />
                <SelectField label="Interes" name="formatInterest" defaultValue="WORKSHOP">
                  <option value="WORKSHOP">Taller practico</option>
                  <option value="TALK">Charla</option>
                  <option value="TRAINING">Capacitacion para equipo</option>
                </SelectField>
                <SelectField label="Programa" name="programId" defaultValue="">
                  <option value="">Por definir</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.title}
                    </option>
                  ))}
                </SelectField>
                <Field
                  icon={<BriefcaseBusiness />}
                  label="Experiencia"
                  name="experienceLevel"
                  placeholder="Nueva, intermedia, avanzada..."
                  className="sm:col-span-2"
                />
              </div>

              <label className="mt-3 block space-y-2 text-sm font-medium text-[#171512]">
                Objetivo
                <textarea
                  name="objective"
                  rows={3}
                  placeholder="Ej. Quiero captar mas propietarios, mejorar cierres o entrenar a mi equipo."
                  className={`${inputClass} h-auto py-3`}
                />
              </label>

              <div className="mt-5 grid gap-3">
                <Button
                  type="submit"
                  variant="brand"
                  size="lg"
                  className="h-12 rounded-xl bg-[#c2923f] text-base hover:bg-[#a77934]"
                  disabled={createLead.isPending}
                >
                  {createLead.isPending ? (
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                  Enviar y abrir WhatsApp
                </Button>
                <Button
                  asChild
                  variant="secondary"
                  size="lg"
                  className="h-12 rounded-xl border-[#d9cbb7] bg-white/70 text-base"
                >
                  <a href={academyWhatsAppUrl()} target="_blank" rel="noreferrer">
                    <MessageCircle className="h-5 w-5" />
                    Solo WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          </form>

          <form
            onSubmit={(event) => void submitPortal(event)}
            className="rounded-2xl border border-[#d9cbb7] bg-white/82 p-5 shadow-[0_18px_55px_rgba(36,31,26,0.12)] backdrop-blur"
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
  'h-11 w-full rounded-xl border border-[#dfd1bf] bg-white/80 px-3 text-sm text-[#171512] outline-none transition focus:border-[#b98a3b] focus:ring-2 focus:ring-[#b98a3b]/20';

function Field({
  label,
  name,
  type = 'text',
  icon,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  icon?: ReactNode;
}): ReactNode {
  return (
    <label className={`space-y-2 text-sm font-medium text-[#171512] ${className}`}>
      {label}
      <span className="relative block">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 flex h-5 w-5 -translate-y-1/2 text-[#a77934] [&>svg]:h-5 [&>svg]:w-5">
            {icon}
          </span>
        )}
        <input
          name={name}
          type={type}
          className={`${inputClass} ${icon ? 'pl-11' : ''}`}
          {...props}
        />
      </span>
    </label>
  );
}

function SelectField({
  label,
  name,
  children,
  defaultValue,
}: {
  label: string;
  name: string;
  children: ReactNode;
  defaultValue?: string;
}): ReactNode {
  return (
    <label className="space-y-2 text-sm font-medium text-[#171512]">
      {label}
      <select name={name} className={inputClass} defaultValue={defaultValue}>
        {children}
      </select>
    </label>
  );
}

function Signal({ icon, label }: { icon: ReactNode; label: string }): ReactNode {
  return (
    <div className="flex min-h-20 items-center gap-3 rounded-xl border border-[#eadfce] bg-white/78 px-4 py-3 text-sm font-semibold text-[#171512] shadow-[0_14px_35px_rgba(36,31,26,0.08)] backdrop-blur">
      <span className="text-[#a77934]">{icon}</span>
      {label}
    </div>
  );
}
