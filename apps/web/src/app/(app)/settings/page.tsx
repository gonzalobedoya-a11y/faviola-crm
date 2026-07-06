'use client';

import {
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
import { useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
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
    <div className="mx-auto max-w-4xl space-y-6">
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
