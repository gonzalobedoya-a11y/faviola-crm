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
import { useCreateAcademyLead, usePublicAcademyPrograms } from '@/features/academy/api';
import type { AcademyFormat } from '@/features/academy/types';

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
  const { data: programs = [] } = usePublicAcademyPrograms();
  const createLead = useCreateAcademyLead();
  const [sent, setSent] = useState(false);

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

  return (
    <main className="relative h-screen overflow-hidden bg-[#f7f2ea] text-[#171512]">
      <Image
        src="/brand/academy-bg.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,252,247,0.97)_0%,rgba(255,252,247,0.82)_34%,rgba(255,252,247,0.5)_61%,rgba(255,252,247,0.18)_100%)]" />

      <section className="relative z-10 mx-auto grid h-screen max-w-[1500px] grid-cols-1 items-center gap-4 px-6 py-4 md:px-8 lg:grid-cols-[0.9fr_0.64fr_0.88fr] lg:px-12">
        <div className="min-w-0 max-w-[620px]">
          <div className="flex items-center gap-5">
            <p className="font-script text-4xl text-[#a77934] md:text-5xl">Academia FV</p>
            <span className="h-px w-16 bg-[#a77934]" />
          </div>

          <h1 className="mt-5 max-w-2xl font-display text-5xl leading-[0.94] text-[#161412] md:text-6xl xl:text-7xl">
            Talleres, charlas y capacitaciones para{' '}
            <span className="text-[#9a7132]">vendedores</span>
          </h1>

          <span className="mt-5 block h-1 w-16 bg-[#a77934]" />

          <p className="mt-5 max-w-xl text-base leading-7 text-[#51483f] md:text-lg">
            Formacion comercial con enfoque practico para vendedores inmobiliarios, equipos y
            personas que quieren ordenar su prospeccion, captacion y cierre.
          </p>

          <div className="mt-6 grid max-w-xl gap-3 sm:grid-cols-3">
            <Signal icon={<BookOpenCheck className="h-5 w-5" />} label="Metodo practico" />
            <Signal icon={<UsersRound className="h-5 w-5" />} label="Para equipos" />
            <Signal icon={<LockKeyhole className="h-5 w-5" />} label="Acceso por codigo" />
          </div>
        </div>

        <div className="relative hidden h-[86vh] min-h-[560px] lg:block">
          <Image
            src="/brand/academy-fv-transparent.png"
            alt="Faviola Velarde"
            fill
            priority
            sizes="390px"
            className="scale-125 object-contain object-bottom drop-shadow-[0_28px_48px_rgba(36,31,26,0.18)]"
          />
        </div>

        <form
          id="lead-form"
          onSubmit={(event) => void submitLead(event)}
          className="max-h-[92vh] overflow-hidden rounded-[24px] border border-[#d9cbb7] bg-[#fffaf4]/95 shadow-[0_26px_80px_rgba(36,31,26,0.18)] backdrop-blur"
        >
          <div className="flex items-center gap-4 bg-[#17191a] px-5 py-3 text-white">
            <span className="relative flex h-11 w-11 shrink-0 overflow-hidden rounded-md border border-[#b98a3b]/70">
              <Image
                src="/brand/logo-monogram.png"
                alt=""
                fill
                sizes="44px"
                className="object-cover"
              />
            </span>
            <div>
              <p className="font-display text-2xl leading-none md:text-3xl">Quiero informacion</p>
              <p className="mt-1 text-xs uppercase text-[#d0a559]">Faviola Velarde</p>
            </div>
          </div>

          <div className="p-4">
            {sent && (
              <div className="mb-3 rounded-xl border border-green-200 bg-green-50 p-2 text-xs text-green-800">
                <CheckCircle2 className="mb-1 h-4 w-4" />
                Listo. El lead quedo registrado y se abrio WhatsApp.
              </div>
            )}
            {createLead.isError && (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                No pudimos registrar tus datos. Intenta nuevamente.
              </div>
            )}

            <div className="grid gap-2.5 sm:grid-cols-2">
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

            <label className="mt-2.5 block space-y-1.5 text-sm font-medium text-[#171512]">
              Objetivo
              <textarea
                name="objective"
                rows={2}
                placeholder="Ej. Quiero captar mas propietarios o entrenar a mi equipo."
                className={`${inputClass} h-[76px] resize-none py-2.5`}
              />
            </label>

            <div className="mt-4 grid gap-2.5">
              <Button
                type="submit"
                variant="brand"
                size="lg"
                className="h-11 rounded-xl bg-[#c2923f] text-base hover:bg-[#a77934]"
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
                className="h-11 rounded-xl border-[#d9cbb7] bg-white/70 text-base"
              >
                <a href={academyWhatsAppUrl()} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-5 w-5" />
                  Solo WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}

const inputClass =
  'h-10 w-full rounded-xl border border-[#dfd1bf] bg-white/80 px-3 text-sm text-[#171512] outline-none transition focus:border-[#b98a3b] focus:ring-2 focus:ring-[#b98a3b]/20';

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
    <label className={`space-y-1.5 text-sm font-medium text-[#171512] ${className}`}>
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
          className={`${inputClass} ${icon ? 'pl-10' : ''}`}
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
    <label className="space-y-1.5 text-sm font-medium text-[#171512]">
      {label}
      <select name={name} className={inputClass} defaultValue={defaultValue}>
        {children}
      </select>
    </label>
  );
}

function Signal({ icon, label }: { icon: ReactNode; label: string }): ReactNode {
  return (
    <div className="flex min-h-16 items-center gap-3 rounded-xl border border-[#eadfce] bg-white/78 px-4 py-3 text-sm font-semibold text-[#171512] shadow-[0_14px_35px_rgba(36,31,26,0.08)] backdrop-blur">
      <span className="text-[#a77934]">{icon}</span>
      {label}
    </div>
  );
}
