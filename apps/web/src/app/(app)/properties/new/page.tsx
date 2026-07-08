'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ImagePlus, LoaderCircle, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type ChangeEvent, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useClients } from '@/features/clients/api';
import { useCreateProperty } from '@/features/properties/api';
import { ApiError } from '@/lib/api/errors';
import { compressPropertyImages } from '@/lib/images';

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
  ownerClientId: z.string().optional(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const fieldClass =
  'h-11 w-full rounded-md border border-border bg-surface-raised px-3 text-[15px] text-content focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const labelClass = 'mb-1.5 block text-sm font-medium text-content';

export default function NewPropertyPage(): ReactNode {
  const router = useRouter();
  const createProperty = useCreateProperty();
  const { data: sellers } = useClients({ type: 'SELLER' });
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [processingImages, setProcessingImages] = useState(false);
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
    try {
      const property = await createProperty.mutateAsync({
        ...values,
        ownerClientId: values.ownerClientId || undefined,
        images,
      });
      router.push(`/properties/${property.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear la propiedad');
    }
  });

  const selectImages = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = event.target.files;
    event.target.value = '';
    if (!files?.length) return;
    setError(null);
    if (images.length + files.length > 8) {
      setError('Puedes guardar hasta 8 imágenes por propiedad.');
      return;
    }
    setProcessingImages(true);
    try {
      const prepared = await compressPropertyImages(files);
      setImages((current) => [...current, ...prepared]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron procesar las imágenes.');
    } finally {
      setProcessingImages(false);
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
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
          <label htmlFor="ownerClientId" className={labelClass}>
            Propietario / captador
          </label>
          <select id="ownerClientId" className={fieldClass} {...register('ownerClientId')}>
            <option value="">Sin propietario asociado</option>
            {sellers?.items.map((seller) => (
              <option key={seller.id} value={seller.id}>
                {seller.firstName} {seller.lastName}
                {seller.phone ? ` · ${seller.phone}` : ''}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-content-muted">
            Registra vendedores en Clientes para asignarlos como propietarios.
          </p>
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
          <span className={labelClass}>Imágenes</span>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface-sunken px-4 py-8 text-center transition-colors hover:border-brand">
            {processingImages ? (
              <LoaderCircle className="h-7 w-7 animate-spin text-brand" />
            ) : (
              <ImagePlus className="h-7 w-7 text-brand" />
            )}
            <span className="text-sm font-medium text-content">
              {processingImages ? 'Comprimiendo imágenes…' : 'Seleccionar imágenes del equipo'}
            </span>
            <span className="text-xs text-content-muted">
              JPG, PNG o WebP · máximo 8 imágenes · 12 MB cada una
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={processingImages}
              onChange={(event) => void selectImages(event)}
              className="sr-only"
              aria-label="Seleccionar imágenes de la propiedad"
            />
          </label>
          {images.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {images.map((src, index) => (
                <div
                  key={`${src.slice(-24)}-${index}`}
                  className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border"
                >
                  <Image
                    src={src}
                    alt={`Vista previa ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="180px"
                  />
                  <button
                    type="button"
                    aria-label={`Quitar imagen ${index + 1}`}
                    onClick={() =>
                      setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))
                    }
                    className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white hover:bg-black/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 rounded bg-black/65 px-2 py-0.5 text-[10px] font-medium text-white">
                      Portada
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="rounded-md border border-danger px-3 py-2 text-sm text-danger">{error}</p>
        )}

        <div className="flex justify-end gap-3">
          <Button asChild variant="secondary">
            <Link href="/properties">Cancelar</Link>
          </Button>
          <Button type="submit" variant="brand" disabled={isSubmitting || processingImages}>
            {isSubmitting ? 'Guardando…' : 'Guardar propiedad'}
          </Button>
        </div>
      </form>
    </div>
  );
}
