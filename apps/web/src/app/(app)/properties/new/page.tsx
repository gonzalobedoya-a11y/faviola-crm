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
import { useCreateProperty } from '@/features/properties/api';
import { ApiError } from '@/lib/api/errors';

const optionalNumber = z.preprocess(
  (value) => (value === '' || value === undefined ? undefined : Number(value)),
  z.number().int().nonnegative().optional(),
);

const schema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  operation: z.enum(['SALE', 'RENT']),
  propertyType: z.string().optional(),
  status: z.enum(['AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'OFF']),
  price: z.preprocess(
    (value) => (value === '' || value === undefined ? undefined : Number(value)),
    z.number({ message: 'Precio inválido' }).int().nonnegative(),
  ),
  currency: z.enum(['PEN', 'USD']),
  bedrooms: optionalNumber,
  bathrooms: optionalNumber,
  area: optionalNumber,
  district: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  imagesText: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const fieldClass =
  'h-11 w-full rounded-md border border-border bg-surface-raised px-3 text-[15px] text-content focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const labelClass = 'mb-1.5 block text-sm font-medium text-content';

export default function NewPropertyPage(): ReactNode {
  const router = useRouter();
  const createProperty = useCreateProperty();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { operation: 'SALE', status: 'AVAILABLE', currency: 'PEN' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const { imagesText, ...rest } = values;
    const images = (imagesText ?? '')
      .split(/[\n,]/)
      .map((line) => line.trim())
      .filter((line) => /^https?:\/\//.test(line));
    try {
      const property = await createProperty.mutateAsync({ ...rest, images });
      router.push(`/properties/${property.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear la propiedad');
    }
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/properties"
          className="inline-flex items-center gap-1 text-sm text-content-secondary hover:text-content"
        >
          <ArrowLeft className="h-4 w-4" />
          Propiedades
        </Link>
        <h1 className="mt-2 font-display text-3xl text-content">Nueva propiedad</h1>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-xl border border-border bg-surface-raised p-6 shadow-elevation-1"
        noValidate
      >
        <div>
          <label htmlFor="title" className={labelClass}>
            Título
          </label>
          <Input id="title" placeholder="Casa moderna en Cayma" {...register('title')} />
          {errors.title && <p className="mt-1 text-xs text-danger">{errors.title.message}</p>}
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="operation" className={labelClass}>
              Operación
            </label>
            <select id="operation" className={fieldClass} {...register('operation')}>
              <option value="SALE">Venta</option>
              <option value="RENT">Alquiler</option>
            </select>
          </div>
          <div>
            <label htmlFor="status" className={labelClass}>
              Estado
            </label>
            <select id="status" className={fieldClass} {...register('status')}>
              <option value="AVAILABLE">Disponible</option>
              <option value="RESERVED">Reservada</option>
              <option value="SOLD">Vendida</option>
              <option value="RENTED">Alquilada</option>
              <option value="OFF">Fuera de mercado</option>
            </select>
          </div>
          <div>
            <label htmlFor="propertyType" className={labelClass}>
              Tipo
            </label>
            <Input
              id="propertyType"
              placeholder="Casa, Depa, Terreno…"
              {...register('propertyType')}
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="price" className={labelClass}>
              Precio
            </label>
            <Input id="price" inputMode="numeric" placeholder="250000" {...register('price')} />
            {errors.price && <p className="mt-1 text-xs text-danger">{errors.price.message}</p>}
          </div>
          <div>
            <label htmlFor="currency" className={labelClass}>
              Moneda
            </label>
            <select id="currency" className={fieldClass} {...register('currency')}>
              <option value="PEN">Soles (S/)</option>
              <option value="USD">Dólares (US$)</option>
            </select>
          </div>
          <div>
            <label htmlFor="area" className={labelClass}>
              Área (m²)
            </label>
            <Input id="area" inputMode="numeric" placeholder="180" {...register('area')} />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-4">
          <div>
            <label htmlFor="bedrooms" className={labelClass}>
              Dormitorios
            </label>
            <Input id="bedrooms" inputMode="numeric" placeholder="3" {...register('bedrooms')} />
          </div>
          <div>
            <label htmlFor="bathrooms" className={labelClass}>
              Baños
            </label>
            <Input id="bathrooms" inputMode="numeric" placeholder="2" {...register('bathrooms')} />
          </div>
          <div>
            <label htmlFor="district" className={labelClass}>
              Distrito
            </label>
            <Input id="district" placeholder="Cayma" {...register('district')} />
          </div>
          <div>
            <label htmlFor="city" className={labelClass}>
              Ciudad
            </label>
            <Input id="city" placeholder="Arequipa" {...register('city')} />
          </div>
        </div>

        <div>
          <label htmlFor="address" className={labelClass}>
            Dirección
          </label>
          <Input id="address" placeholder="Av. Ejemplo 123" {...register('address')} />
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>
            Descripción
          </label>
          <textarea
            id="description"
            rows={3}
            className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-[15px] text-content focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register('description')}
          />
        </div>

        <div>
          <label htmlFor="imagesText" className={labelClass}>
            Imágenes (una URL por línea)
          </label>
          <textarea
            id="imagesText"
            rows={3}
            placeholder="https://…/foto1.jpg&#10;https://…/foto2.jpg"
            className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-content focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register('imagesText')}
          />
          <p className="mt-1 text-xs text-content-muted">
            La carga de archivos (MinIO) se habilita en un siguiente incremento; por ahora se
            registran por URL.
          </p>
        </div>

        {error && (
          <p className="rounded-md border border-danger px-3 py-2 text-sm text-danger">{error}</p>
        )}

        <div className="flex justify-end gap-3">
          <Button asChild variant="secondary">
            <Link href="/properties">Cancelar</Link>
          </Button>
          <Button type="submit" variant="brand" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando…' : 'Guardar propiedad'}
          </Button>
        </div>
      </form>
    </div>
  );
}
