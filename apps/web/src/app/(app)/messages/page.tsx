'use client';

import { Mail, MessageCircle, Search, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';

import { useClients } from '@/features/clients/api';

export default function MessagesPage(): ReactNode {
  const { data, isLoading, isError } = useClients({});
  const [query, setQuery] = useState('');
  const contacts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (data?.items ?? []).filter((client) => {
      if (!normalized) return true;
      return `${client.firstName} ${client.lastName} ${client.phone ?? ''} ${client.email ?? ''}`
        .toLowerCase()
        .includes(normalized);
    });
  }, [data, query]);

  return (
    <div className="w-full max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-content">Mensajes</h1>
        <p className="mt-1 text-sm text-content-muted">
          Contacta a tus clientes por WhatsApp o correo.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar contacto..."
          aria-label="Buscar contacto"
          className="h-11 w-full rounded-md border border-border bg-surface-raised pl-9 pr-3 text-sm text-content focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-surface-raised shadow-elevation-1">
        {isLoading ? (
          <p className="p-10 text-center text-sm text-content-muted">Cargando contactos…</p>
        ) : isError ? (
          <p className="p-10 text-center text-sm text-danger">
            No se pudieron cargar los contactos.
          </p>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <UserRound className="h-8 w-8 text-brand" />
            <div>
              <p className="font-medium text-content">No hay contactos disponibles</p>
              <p className="mt-1 text-sm text-content-muted">
                Agrega teléfono o correo a un cliente.
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {contacts.map((client) => {
              const phone = client.phone?.replace(/\D/g, '') ?? '';
              const whatsapp = phone.startsWith('51') ? phone : phone ? `51${phone}` : '';
              const greeting = encodeURIComponent(
                `Hola ${client.firstName}, soy Faviola Velarde. ¿Cómo estás?`,
              );
              return (
                <li
                  key={client.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-medium uppercase text-brand-foreground">
                    {client.firstName[0]}
                    {client.lastName[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/clients/${client.id}`}
                      className="text-sm font-medium text-content hover:text-brand-deep"
                    >
                      {client.firstName} {client.lastName}
                    </Link>
                    <p className="truncate text-xs text-content-muted">
                      {client.phone ?? client.email ?? 'Sin datos de contacto'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {whatsapp && (
                      <a
                        href={`https://wa.me/${whatsapp}?text=${greeting}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm text-content-secondary hover:bg-surface-sunken hover:text-content"
                      >
                        <MessageCircle className="h-4 w-4 text-success" /> WhatsApp
                      </a>
                    )}
                    {client.email && (
                      <a
                        href={`mailto:${client.email}?subject=${encodeURIComponent('Faviola Velarde · Asesoría inmobiliaria')}`}
                        className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm text-content-secondary hover:bg-surface-sunken hover:text-content"
                      >
                        <Mail className="h-4 w-4 text-brand" /> Correo
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
