'use client';

import {
  Bot,
  CheckCircle2,
  LockKeyhole,
  LogOut,
  Monitor,
  Moon,
  ShieldCheck,
  Sun,
  UserRound,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { type AutoMode, useAiSettings, useUpdateAiSettings } from '@/features/inbox/api';
import { httpClient } from '@/lib/api/http';
import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/lib/utils';

interface HealthData {
  status: string;
  service: string;
  version: string;
  database: string;
}

const themes = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
] as const;

export default function SettingsPage(): ReactNode {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const health = useQuery({
    queryKey: ['health'],
    queryFn: () => httpClient.get<HealthData>('/health'),
    refetchInterval: 60_000,
  });

  const signOut = async (): Promise<void> => {
    await logout();
    router.replace('/login');
  };

  const changePassword = async (): Promise<void> => {
    setPasswordMessage(null);
    if (newPassword !== confirmPassword) {
      setPasswordMessage('Las contraseñas nuevas no coinciden.');
      return;
    }
    setChangingPassword(true);
    try {
      await httpClient.post('/auth/change-password', { currentPassword, newPassword });
      await logout();
      router.replace('/login');
    } catch (error) {
      setPasswordMessage(
        error instanceof Error ? error.message : 'No se pudo cambiar la contraseña.',
      );
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="w-full max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-content">Configuración</h1>
        <p className="mt-1 text-sm text-content-muted">Perfil, apariencia y estado del sistema.</p>
      </div>

      <section className="rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
        <div className="flex items-center gap-2">
          <UserRound className="h-5 w-5 text-brand" />
          <h2 className="font-semibold text-content">Perfil</h2>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Info label="Nombre" value={user ? `${user.firstName} ${user.lastName}` : '—'} />
          <Info label="Correo" value={user?.email ?? '—'} />
          <Info label="Rol" value={user?.role ?? '—'} />
          <Info label="Cuenta" value="Faviola Velarde" />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
        <div className="flex items-center gap-2">
          <Monitor className="h-5 w-5 text-brand" />
          <h2 className="font-semibold text-content">Apariencia</h2>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {themes.map((option) => {
            const Icon = option.icon;
            const selected = theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                aria-pressed={selected}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-4 text-left transition-colors',
                  selected
                    ? 'border-brand bg-brand-tint text-brand-deep'
                    : 'border-border text-content-secondary hover:bg-surface-sunken',
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1 text-sm font-medium">
                  Tema {option.label.toLowerCase()}
                </span>
                {selected && <CheckCircle2 className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      </section>

      <AiAssistantSection />

      <section className="rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
        <div className="flex items-center gap-2">
          <LockKeyhole className="h-5 w-5 text-brand" />
          <h2 className="font-semibold text-content">Cambiar contraseña</h2>
        </div>
        <p className="mt-1 text-xs text-content-muted">
          Al cambiarla se cerrarán todas las sesiones abiertas.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="Contraseña actual"
            aria-label="Contraseña actual"
            autoComplete="current-password"
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-content"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="Nueva contraseña"
            aria-label="Nueva contraseña"
            autoComplete="new-password"
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-content"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirmar contraseña"
            aria-label="Confirmar nueva contraseña"
            autoComplete="new-password"
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-content"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button
            variant="brand"
            onClick={() => void changePassword()}
            disabled={
              !currentPassword || newPassword.length < 10 || !confirmPassword || changingPassword
            }
          >
            {changingPassword ? 'Actualizando…' : 'Actualizar contraseña'}
          </Button>
          {passwordMessage && <p className="text-sm text-danger">{passwordMessage}</p>}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-brand" />
          <h2 className="font-semibold text-content">Sistema y seguridad</h2>
        </div>
        <div className="mt-4 flex flex-col gap-4 rounded-lg bg-surface-sunken p-4 sm:flex-row sm:items-center">
          <span
            className={cn(
              'h-2.5 w-2.5 rounded-full',
              health.isSuccess ? 'bg-success' : health.isError ? 'bg-danger' : 'bg-warning',
            )}
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-content">
              {health.isSuccess
                ? 'Todos los servicios operativos'
                : health.isError
                  ? 'No se pudo verificar el sistema'
                  : 'Verificando servicios…'}
            </p>
            <p className="mt-0.5 text-xs text-content-muted">
              {health.data
                ? `API ${health.data.version} · Base de datos ${health.data.database}`
                : 'La comprobación se actualiza automáticamente.'}
            </p>
          </div>
          <Button variant="secondary" onClick={() => void health.refetch()}>
            Volver a comprobar
          </Button>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-border pt-5">
          <div>
            <p className="text-sm font-medium text-content">Cerrar sesión</p>
            <p className="text-xs text-content-muted">Finaliza de forma segura la sesión actual.</p>
          </div>
          <Button variant="secondary" onClick={() => void signOut()}>
            <LogOut className="h-4 w-4" /> Salir
          </Button>
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-content-muted">{label}</p>
      <p className="mt-1 text-sm text-content">{value}</p>
    </div>
  );
}

const modeOptions: { key: AutoMode; title: string; description: string }[] = [
  {
    key: 'OFF',
    title: 'Copiloto',
    description: 'Claude solo sugiere respuestas. Tú revisas y envías cada mensaje.',
  },
  {
    key: 'AFTER_HOURS',
    title: 'Fuera de horario',
    description: 'Responde solo cuando no atiendes (noches, días libres). En tu horario, sugiere.',
  },
  {
    key: 'ALWAYS',
    title: 'Siempre',
    description: 'Responde apenas llega el mensaje, con filtro de seguridad activo.',
  },
];

const dayLabels = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

function AiAssistantSection(): ReactNode {
  const { data } = useAiSettings();
  const update = useUpdateAiSettings();
  const [instructions, setInstructions] = useState('');
  const [saved, setSaved] = useState(false);
  const loaded = data?.instructions;

  useEffect(() => {
    if (typeof loaded === 'string') setInstructions(loaded);
  }, [loaded]);

  const mode = data?.autoMode ?? 'OFF';
  const workDays = data?.workDays ?? [1, 2, 3, 4, 5, 6];

  const toggleDay = (day: number): void => {
    const next = workDays.includes(day)
      ? workDays.filter((d) => d !== day)
      : [...workDays, day].sort();
    void update.mutateAsync({ workDays: next });
  };

  const saveInstructions = async (): Promise<void> => {
    await update.mutateAsync({ instructions });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <section className="rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-brand" />
          <h2 className="font-semibold text-content">Asistente Claude</h2>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
            data?.configured ? 'bg-success/10 text-success' : 'bg-warning/15 text-warning',
          )}
        >
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              data?.configured ? 'bg-success' : 'bg-warning',
            )}
          />
          {data?.configured ? `Conectado (${data.model})` : 'Sin conectar — falta API key'}
        </span>
      </div>
      <p className="mt-1 text-sm text-content-muted">
        Controla cuándo responde solo, tu horario de atención y su conocimiento del negocio.
      </p>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {modeOptions.map((option) => {
          const selected = mode === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => void update.mutateAsync({ autoMode: option.key })}
              aria-pressed={selected}
              className={cn(
                'rounded-lg border p-4 text-left transition-colors',
                selected ? 'border-brand bg-brand-tint' : 'border-border hover:bg-surface-sunken',
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'text-sm font-semibold',
                    selected ? 'text-brand-deep' : 'text-content',
                  )}
                >
                  {option.title}
                </span>
                {selected && <CheckCircle2 className="h-4 w-4 text-brand-deep" />}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-content-muted">
                {option.description}
              </p>
            </button>
          );
        })}
      </div>

      {mode === 'AFTER_HOURS' && (
        <div className="mt-4 grid gap-4 rounded-lg border border-border bg-surface-sunken/50 p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-content-muted">
              Horario en que Faviola atiende
            </p>
            <div className="mt-2 flex items-center gap-2 text-sm text-content">
              <select
                value={data?.hoursStart ?? 9}
                onChange={(e) => void update.mutateAsync({ hoursStart: Number(e.target.value) })}
                aria-label="Hora de inicio"
                className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-content focus-visible:border-brand focus-visible:outline-none"
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
              <span className="text-content-muted">a</span>
              <select
                value={data?.hoursEnd ?? 19}
                onChange={(e) => void update.mutateAsync({ hoursEnd: Number(e.target.value) })}
                aria-label="Hora de fin"
                className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-content focus-visible:border-brand focus-visible:outline-none"
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-1.5 text-[11px] text-content-muted">
              Fuera de este horario (y en días no marcados), Claude responde automáticamente.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-content-muted">
              Días de atención
            </p>
            <div className="mt-2 flex gap-1.5">
              {dayLabels.map((label, day) => {
                const active = workDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    aria-pressed={active}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                      active
                        ? 'bg-brand text-on-brand'
                        : 'bg-surface text-content-muted hover:bg-brand-tint hover:text-brand-deep',
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-content-muted">
              Domingo sin marcar = Claude atiende solo todo el día.
            </p>
          </div>
        </div>
      )}

      {mode !== 'OFF' && (
        <p className="mt-3 rounded-lg bg-surface-sunken/60 p-3 text-xs leading-relaxed text-content-muted">
          🛟 <b className="text-content-secondary">Filtro de seguridad siempre activo:</b> Claude
          solo responde consultas informativas (precio, dirección, características, disponibilidad).
          Negociaciones, cierres, visitas, temas legales o quejas se marcan como «Requiere Faviola»
          y no se responden solos.
        </p>
      )}

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-content-muted">
          Conocimiento del negocio (entrenamiento)
        </p>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={4}
          placeholder="Ej. Atiendo de lunes a sábado de 9am a 7pm. Trabajo con crédito hipotecario BCP e Interbank. Mi comisión es 3%. Siempre ofrezco agendar una visita."
          className="mt-2 w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-success">{saved ? '✓ Guardado' : ''}</span>
          <Button
            variant="brand"
            size="sm"
            onClick={() => void saveInstructions()}
            disabled={update.isPending}
          >
            Guardar conocimiento
          </Button>
        </div>
      </div>
    </section>
  );
}
