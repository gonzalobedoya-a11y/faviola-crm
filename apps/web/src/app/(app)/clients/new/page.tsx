'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateClient } from '@/features/clients/api';
import { ApiError } from '@/lib/api/errors';

const schema = z.object({
  type: z.enum(['BUYER', 'SELLER', 'BOTH']),
  firstName: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().min(1, 'El apellido es obligatorio'),
  phone: z.string().optional(),
  email: z.union([z.string().email('Correo inválido'), z.literal('')]).optional(),
  source: z.string().optional(),
  temperature: z.enum(['HOT', 'WARM', 'COLD']),
  notes: z.string().optional(),
  operation: z.enum(['SALE', 'RENT']),
  propertyType: z.string().optional(),
  budgetMin: z.string().optional(),
  budgetMax: z.string().optional(),
  bedroomsMin: z.string().optional(),
  bathroomsMin: z.string().optional(),
  areaMin: z.string().optional(),
  zones: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const fieldClass =
  'h-11 w-full rounded-md border border-border bg-surface-raised px-3 text-[15px] text-content focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const labelClass = 'mb-1.5 block text-sm font-medium text-content';

export default function NewClientPage(): ReactNode {
  const router = useRouter();
  const createClient = useCreateClient();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'BUYER', temperature: 'WARM', operation: 'SALE' },
  });
  const clientType = watch('type');

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const {
        operation,
        propertyType,
        budgetMin,
        budgetMax,
        bedroomsMin,
        bathroomsMin,
        areaMin,
        zones,
        ...clientValues
      } = values;
      const numberOrUndefined = (value?: string): number | undefined =>
        value?.trim() ? Number(value) : undefined;
      const client = await createClient.mutateAsync({
        ...clientValues,
        requirement:
          values.type === 'SELLER'
            ? undefined
            : {
                operation,
                propertyType: propertyType || undefined,
                budgetMin: numberOrUndefined(budgetMin),
                budgetMax: numberOrUndefined(budgetMax),
                currency: 'PEN',
                bedroomsMin: numberOrUndefined(bedroomsMin),
                bathroomsMin: numberOrUndefined(bathroomsMin),
                areaMin: numberOrUndefined(areaMin),
                zones:
                  zones
                    ?.split(',')
                    .map((zone) => zone.trim())
                    .filter(Boolean) ?? [],
              },
      });
      router.push(`/clients/${client.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear el cliente');
    }
  });

  return (
    <div className="w-full max-w-3xl space-y-6">
      <div>
        <Link
          href="/clients"
          className="inline-flex items-center gap-1 text-sm text-content-secondary hover:text-content"
        >
          <ArrowLeft className="h-4 w-4" />
          Clientes
        </Link>
        <h1 className="mt-2 font-display text-3xl text-content">Nuevo cliente</h1>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-xl border border-border bg-surface-raised p-6 shadow-elevation-1"
        noValidate
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="type" className={labelClass}>
              Tipo
            </label>
            <select id="type" className={fieldClass} {...register('type')}>
              <option value="BUYER">Comprador</option>
              <option value="SELLER">Vendedor</option>
              <option value="BOTH">Comprador y vendedor</option>
            </select>
          </div>
          <div>
            <label htmlFor="temperature" className={labelClass}>
              Temperatura
            </label>
            <select id="temperature" className={fieldClass} {...register('temperature')}>
              <option value="HOT">Caliente</option>
              <option value="WARM">Tibio</option>
              <option value="COLD">Frío</option>
            </select>
          </div>
          <div>
            <label htmlFor="firstName" className={labelClass}>
              Nombre
            </label>
            <Input id="firstName" {...register('firstName')} />
            {errors.firstName && (
              <p className="mt-1 text-xs text-danger">{errors.firstName.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="lastName" className={labelClass}>
              Apellido
            </label>
            <Input id="lastName" {...register('lastName')} />
            {errors.lastName && (
              <p className="mt-1 text-xs text-danger">{errors.lastName.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>
              Teléfono
            </label>
            <Input id="phone" placeholder="+51 9..." {...register('phone')} />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>
              Correo
            </label>
            <Input
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
              {...register('email')}
            />
            {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="source" className={labelClass}>
              Origen
            </label>
            <Input id="source" placeholder="Referido, Facebook, portal…" {...register('source')} />
          </div>
          {clientType !== 'SELLER' && (
            <fieldset className="grid gap-5 rounded-lg border border-border bg-surface-sunken p-4 sm:col-span-2 sm:grid-cols-2">
              <legend className="px-2 text-sm font-semibold text-content">
                Qué propiedad busca
              </legend>
              <div>
                <label htmlFor="operation" className={labelClass}>
                  Operación
                </label>
                <select id="operation" className={fieldClass} {...register('operation')}>
                  <option value="SALE">Compra</option>
                  <option value="RENT">Alquiler</option>
                </select>
              </div>
              <div>
                <label htmlFor="propertyType" className={labelClass}>
                  Tipo de propiedad
                </label>
                <Input
                  id="propertyType"
                  placeholder="Casa, departamento…"
                  {...register('propertyType')}
                />
              </div>
              <div>
                <label htmlFor="budgetMin" className={labelClass}>
                  Presupuesto mínimo (S/)
                </label>
                <Input id="budgetMin" type="number" min="0" {...register('budgetMin')} />
              </div>
              <div>
                <label htmlFor="budgetMax" className={labelClass}>
                  Presupuesto máximo (S/)
                </label>
                <Input id="budgetMax" type="number" min="0" {...register('budgetMax')} />
              </div>
              <div>
                <label htmlFor="bedroomsMin" className={labelClass}>
                  Dormitorios mínimos
                </label>
                <Input id="bedroomsMin" type="number" min="0" {...register('bedroomsMin')} />
              </div>
              <div>
                <label htmlFor="bathroomsMin" className={labelClass}>
                  Baños mínimos
                </label>
                <Input id="bathroomsMin" type="number" min="0" {...register('bathroomsMin')} />
              </div>
              <div>
                <label htmlFor="areaMin" className={labelClass}>
                  Área mínima (m²)
                </label>
                <Input id="areaMin" type="number" min="0" {...register('areaMin')} />
              </div>
              <div>
                <label htmlFor="zones" className={labelClass}>
                  Zonas
                </label>
                <Input id="zones" placeholder="Cayma, Yanahuara…" {...register('zones')} />
                <p className="mt-1 text-xs text-content-muted">Separa varias zonas con comas.</p>
              </div>
            </fieldset>
          )}
          <div className="sm:col-span-2">
            <label htmlFor="notes" className={labelClass}>
              Notas
            </label>
            <textarea
              id="notes"
              rows={3}
              className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-[15px] text-content focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register('notes')}
            />
          </div>
        </div>

        {error && (
          <p className="rounded-md border border-danger px-3 py-2 text-sm text-danger">{error}</p>
        )}

        <div className="flex justify-end gap-3">
          <Button asChild variant="secondary">
            <Link href="/clients">Cancelar</Link>
          </Button>
          <Button type="submit" variant="brand" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando…' : 'Guardar cliente'}
          </Button>
        </div>
      </form>
    </div>
  );
}
