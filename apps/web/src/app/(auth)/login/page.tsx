'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Eye, EyeOff, Lock, ShieldCheck, User } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { ApiError } from '@/lib/api/errors';
import { useAuth } from '@/lib/auth/auth-context';

const schema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

type FormValues = z.infer<typeof schema>;

const inputClass =
  'h-12 w-full rounded-xl border border-[#e2d8c5] bg-white/85 pl-10 text-[15px] text-[#1b1a18] placeholder:text-[#a89f8d] focus:border-[#a9884e] focus:outline-none focus:ring-2 focus:ring-[#a9884e]/25';

export default function LoginPage(): ReactNode {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await login(values.email, values.password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión');
    }
  });

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Fondo: casa */}
      <Image src="/brand/login-bg.jpg" alt="" fill priority className="object-cover" />
      {/* Velo claro a la izquierda para legibilidad del texto */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(250,247,240,0.94) 0%, rgba(250,247,240,0.55) 30%, rgba(250,247,240,0) 52%)',
        }}
      />

      {/* Faviola (recorte) — centrada entre el texto y la tarjeta */}
      <div className="pointer-events-none absolute bottom-0 left-[46%] hidden h-[90%] w-[34%] -translate-x-1/2 lg:block">
        <Image
          src="/brand/faviola-hd.png"
          alt="Faviola Velarde"
          fill
          priority
          className="object-contain object-bottom"
        />
      </div>

      {/* Contenido */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-center gap-10 px-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-12">
        {/* Texto izquierdo */}
        <div className="hidden max-w-md lg:block lg:-translate-y-12">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-[#a9884e]">
            Asesoría patrimonial inmobiliaria
          </p>
          <h1 className="mt-6 font-display text-5xl leading-[1.1] text-[#1b1a18]">
            Encuentra el hogar
            <br />
            <span className="text-[#a9884e]">ideal para ti.</span>
          </h1>
          <div className="mt-6 h-[3px] w-14 rounded-full bg-[#a9884e]" />
          <p className="mt-6 max-w-sm text-[17px] leading-relaxed text-[#5c5647]">
            Gestiona tus clientes, propiedades y negociaciones desde un solo lugar.
          </p>
        </div>

        {/* Tarjeta de acceso */}
        <div className="w-full max-w-md lg:ml-auto">
          <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-[0_20px_60px_rgba(27,26,24,0.18)] backdrop-blur-xl">
            {/* Marca */}
            <div className="flex flex-col items-center text-center">
              <Image
                src="/brand/logo-monogram.png"
                alt="Faviola Velarde"
                width={64}
                height={56}
                className="h-14 w-auto object-contain"
                priority
              />
              <p className="mt-3 font-display text-xl tracking-[0.18em] text-[#1b1a18]">
                FAVIOLA VELARDE
              </p>
              <div className="mt-1.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-[#a9884e]">
                <span className="h-px w-6 bg-[#a9884e]/50" />
                Asesoría patrimonial
                <span className="h-px w-6 bg-[#a9884e]/50" />
              </div>
            </div>

            <h2 className="mt-7 text-center font-display text-2xl text-[#1b1a18]">
              Bienvenido nuevamente
            </h2>
            <p className="mt-1 text-center text-sm text-[#8a8069]">Ingresa a tu CRM privado</p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#3d3a33]">
                  Correo o usuario
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#a9884e]" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="ej: faviola@faviolavelarde.com"
                    className={`${inputClass} pr-3`}
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-[#a9432f]">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-[#3d3a33]"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#a9884e]" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Ingresa tu contraseña"
                    className={`${inputClass} pr-10`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a89f8d] hover:text-[#a9884e]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-[18px] w-[18px]" />
                    ) : (
                      <Eye className="h-[18px] w-[18px]" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-[#a9432f]">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-[#5c5647]">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-[#d8cebb] accent-[#a9884e]"
                  />
                  Recordarme
                </label>
                <button type="button" className="text-sm text-[#a9884e] hover:underline">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {error && (
                <p className="rounded-lg border border-[#a9432f] bg-[#a9432f]/5 px-3 py-2 text-sm text-[#a9432f]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#a9884e] text-[15px] font-medium text-white shadow-sm transition-colors hover:bg-[#96703c] disabled:opacity-60"
              >
                {isSubmitting ? 'Ingresando…' : 'Ingresar'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-7 flex items-center justify-center gap-2 text-[#8a8069]">
              <ShieldCheck className="h-4 w-4 text-[#a9884e]" />
              <div className="text-center leading-tight">
                <p className="text-xs font-medium text-[#5c5647]">Plataforma privada y segura</p>
                <p className="text-[10px]">Conexión protegida SSL 256-bit</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
