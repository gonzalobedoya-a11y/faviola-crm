'use client';

import {
  BarChart3,
  Bot,
  Building2,
  Check,
  GraduationCap,
  Loader2,
  Search,
  Send,
  Sparkles,
  StickyNote,
  Tag,
  UserRound,
  Wand2,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  useAiAssist,
  useAiSettings,
  useConversation,
  useInbox,
  useSendMessage,
  useUpdateAiSettings,
  useUpdateConversation,
} from '@/features/inbox/api';
import { ChannelLogo, channelMeta } from '@/features/inbox/channel';
import type {
  ChannelStatus,
  ConversationStatus,
  InboxChannel,
  InboxMessage,
} from '@/features/inbox/types';
import { useProperties } from '@/features/properties/api';
import { formatMoney } from '@/lib/format';

const statusLabel: Record<ConversationStatus, string> = {
  OPEN: 'Abierta',
  PENDING: 'Pendiente',
  CLOSED: 'Cerrada',
};

const channelStatusLabel: Record<ChannelStatus, string> = {
  CONNECTED: 'Conectado',
  PENDING: 'Por conectar',
  DISCONNECTED: 'Desconectado',
};

function isWhatsAppWindowExpired(conversation: {
  channel: InboxChannel;
  messages: InboxMessage[];
}): boolean {
  if (conversation.channel !== 'WHATSAPP') return false;
  const lastContact = [...conversation.messages].reverse().find((m) => m.author === 'CONTACT');
  if (!lastContact) return false;
  return Date.now() - new Date(lastContact.createdAt).getTime() > 24 * 60 * 60 * 1000;
}

function timeAgo(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h`;
  return `${Math.round(h / 24)} d`;
}

export default function MessagesPage(): ReactNode {
  const [channel, setChannel] = useState<InboxChannel | undefined>();
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useInbox({ channel, q: q.trim() || undefined });
  const all = data?.conversations ?? [];
  const conversations = onlyUnread ? all.filter((c) => c.unread > 0) : all;
  const unreadTotal = data?.counts.unread ?? 0;

  // Selecciona la primera conversación automáticamente.
  useEffect(() => {
    const first = conversations[0];
    if (!selectedId && first) setSelectedId(first.id);
  }, [conversations, selectedId]);

  return (
    <div className="flex h-[calc(100vh-7.5rem)] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-content">Bandeja omnicanal</h1>
          <p className="text-sm text-content-muted">
            Todos tus mensajes de redes en un solo lugar, con el asistente de Claude.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(data?.accounts ?? []).map((account) => {
            const meta = channelMeta[account.channel];
            const connected = account.status === 'CONNECTED';
            return (
              <span
                key={account.id}
                title={`${meta.label}: ${channelStatusLabel[account.status]}`}
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
                style={{
                  borderColor: connected ? meta.color : 'var(--border-strong)',
                  color: connected ? meta.color : 'var(--content-muted)',
                  background: connected ? meta.bg : 'transparent',
                }}
              >
                <ChannelLogo channel={account.channel} size={16} />
                {meta.label}
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: connected ? '#3faa6a' : '#c8a54a' }}
                />
              </span>
            );
          })}
          <Button asChild variant="brand" size="sm">
            <Link href="/messages/dashboard">
              <BarChart3 className="h-4 w-4" />
              Dashboard de leads
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[20rem_1fr] xl:grid-cols-[20rem_1fr_20rem]">
        {/* Panel izquierdo: lista */}
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-surface-raised shadow-elevation-1">
          <div className="space-y-2 border-b border-border p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar conversación…"
                className="h-9 w-full rounded-lg border border-border bg-surface-sunken pl-9 pr-3 text-sm text-content placeholder:text-content-muted focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex gap-1.5">
              <FilterChip active={!onlyUnread} onClick={() => setOnlyUnread(false)}>
                Todos
              </FilterChip>
              <FilterChip active={onlyUnread} onClick={() => setOnlyUnread(true)}>
                No leídos{unreadTotal > 0 ? ` (${unreadTotal})` : ''}
              </FilterChip>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <FilterChip active={!channel} onClick={() => setChannel(undefined)}>
                Todas
              </FilterChip>
              {(['WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'TIKTOK'] as InboxChannel[]).map((c) => (
                <FilterChip key={c} active={channel === c} onClick={() => setChannel(c)}>
                  <ChannelLogo channel={c} size={13} />
                  {channelMeta[c].label}
                </FilterChip>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoading ? (
              <p className="p-6 text-center text-sm text-content-muted">Cargando…</p>
            ) : conversations.length === 0 ? (
              <p className="p-6 text-center text-sm text-content-muted">Sin conversaciones.</p>
            ) : (
              conversations.map((c) => {
                const meta = channelMeta[c.channel];
                const active = c.id === selectedId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`flex w-full gap-3 border-b border-border px-3 py-3 text-left transition-colors ${
                      active ? 'bg-brand-tint/60' : 'hover:bg-surface-sunken'
                    }`}
                  >
                    <span className="relative shrink-0">
                      <span
                        className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold"
                        style={{ background: meta.bg, color: meta.color }}
                      >
                        {c.contactName.slice(0, 1)}
                      </span>
                      <span className="absolute -bottom-1 -right-1 rounded-[30%] bg-surface-raised p-0.5 shadow-elevation-1">
                        <ChannelLogo channel={c.channel} size={16} />
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-content">
                          {c.contactName}
                        </span>
                        <span className="shrink-0 text-[11px] text-content-muted">
                          {timeAgo(c.lastMessageAt)}
                        </span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-2">
                        <span className="truncate text-xs text-content-muted">
                          {c.lastPreview ?? '—'}
                        </span>
                        {c.unread > 0 && (
                          <span className="ml-auto flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-on-brand">
                            {c.unread}
                          </span>
                        )}
                      </span>
                      {c.tags.length > 0 && (
                        <span className="mt-1 flex flex-wrap gap-1">
                          {c.tags.slice(0, 2).map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-surface-sunken px-1.5 py-0.5 text-[10px] text-content-secondary"
                            >
                              {t}
                            </span>
                          ))}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Panel central: hilo */}
        <Thread conversationId={selectedId} aiConfigured={data?.counts.aiConfigured ?? false} />

        {/* Panel derecho: contexto + IA */}
        <ContextPanel conversationId={selectedId} allTags={data?.tags ?? []} />
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}): ReactNode {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? 'bg-brand text-on-brand'
          : 'bg-surface-sunken text-content-secondary hover:bg-brand-tint hover:text-brand-deep'
      }`}
    >
      {children}
    </button>
  );
}

function Thread({
  conversationId,
  aiConfigured,
}: {
  conversationId: string | null;
  aiConfigured: boolean;
}): ReactNode {
  const { data: conversation, isLoading } = useConversation(conversationId);
  const sendMessage = useSendMessage(conversationId ?? '');
  const aiAssist = useAiAssist();
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages.length]);

  const suggest = async (): Promise<void> => {
    if (!conversationId) return;
    const result = await aiAssist.mutateAsync({ conversationId, mode: 'reply' });
    setText(result.text);
  };

  const submit = async (): Promise<void> => {
    if (!text.trim() || !conversationId) return;
    await sendMessage.mutateAsync(text.trim());
    setText('');
  };

  if (!conversationId) {
    return (
      <section className="flex items-center justify-center rounded-xl border border-border bg-surface-raised text-sm text-content-muted">
        Selecciona una conversación
      </section>
    );
  }

  const meta = conversation ? channelMeta[conversation.channel] : channelMeta.WHATSAPP;

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-surface-raised shadow-elevation-1">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
          style={{ background: meta.bg, color: meta.color }}
        >
          {conversation?.contactName.slice(0, 1) ?? '·'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-content">
            {conversation?.contactName ?? '…'}
          </p>
          <p className="flex items-center gap-1.5 truncate text-xs text-content-muted">
            {conversation && <ChannelLogo channel={conversation.channel} size={14} />}
            {meta.label} · {conversation?.contactHandle ?? ''}
          </p>
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-surface-sunken/40 p-4">
        {isLoading ? (
          <p className="text-center text-sm text-content-muted">Cargando mensajes…</p>
        ) : (
          conversation?.messages.map((m) => <Bubble key={m.id} message={m} />)
        )}
        <div ref={bottomRef} />
      </div>

      {conversation && isWhatsAppWindowExpired(conversation) && (
        <div className="border-t border-warning/30 bg-warning/10 px-4 py-2.5 text-xs text-warning">
          🕐 Han pasado más de 24 horas desde el último mensaje del cliente. Cuando WhatsApp esté
          conectado, solo podrás enviar plantillas aprobadas fuera de esta ventana.
        </div>
      )}

      <div className="border-t border-border p-3">
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => void suggest()}
            disabled={aiAssist.isPending}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 px-3 py-1 text-xs font-semibold text-brand-deep transition hover:bg-brand-tint disabled:opacity-60"
          >
            {aiAssist.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Wand2 className="h-3.5 w-3.5" />
            )}
            Sugerir respuesta con Claude
          </button>
          {!aiConfigured && (
            <span className="text-[11px] text-content-muted">Claude sin conectar</span>
          )}
        </div>
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void submit();
            }}
            rows={2}
            placeholder="Escribe tu respuesta…  (Ctrl/⌘+Enter para enviar)"
            className="max-h-32 min-h-[2.75rem] flex-1 resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button
            variant="brand"
            size="icon"
            onClick={() => void submit()}
            disabled={!text.trim() || sendMessage.isPending}
            aria-label="Enviar"
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}

function Bubble({ message }: { message: InboxMessage }): ReactNode {
  const isContact = message.author === 'CONTACT';
  const isAi = message.author === 'AI';
  if (isContact) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[78%] rounded-2xl rounded-tl-sm bg-surface-raised px-3.5 py-2 text-sm text-content shadow-elevation-1">
          {message.body}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-end">
      <div
        className={`max-w-[78%] rounded-2xl rounded-tr-sm px-3.5 py-2 text-sm shadow-elevation-1 ${
          isAi ? 'bg-[#eef1f8] text-[#2c3350]' : 'bg-brand text-on-brand'
        }`}
      >
        {isAi && (
          <span className="mb-1 flex items-center gap-1 text-[11px] font-semibold opacity-80">
            <Sparkles className="h-3 w-3" /> Sugerido por Claude
          </span>
        )}
        {message.body}
      </div>
    </div>
  );
}

const temperatureLabel: Record<string, { label: string; className: string }> = {
  HOT: { label: 'Caliente', className: 'text-danger' },
  WARM: { label: 'Templado', className: 'text-warning' },
  COLD: { label: 'Frío', className: 'text-info' },
};

const propertyStatusLabel: Record<string, string> = {
  AVAILABLE: 'Disponible',
  RESERVED: 'Reservada',
  SOLD: 'Vendida',
  RENTED: 'Alquilada',
  OFF: 'Inactiva',
};

function InfoRow({
  label,
  value,
  valueClass = '',
}: {
  label: string;
  value: string;
  valueClass?: string;
}): ReactNode {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-xs text-content-muted">{label}</dt>
      <dd className={`truncate text-right text-xs font-medium text-content ${valueClass}`}>
        {value}
      </dd>
    </div>
  );
}

function ContextPanel({
  conversationId,
  allTags,
}: {
  conversationId: string | null;
  allTags: string[];
}): ReactNode {
  const { data: conversation } = useConversation(conversationId);
  const { data: propertiesData } = useProperties({});
  const update = useUpdateConversation(conversationId ?? '');
  const aiAssist = useAiAssist();
  const [prompt, setPrompt] = useState('');
  const [answer, setAnswer] = useState('');
  const [newTag, setNewTag] = useState('');
  const [notesDraft, setNotesDraft] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    setAnswer('');
    setPrompt('');
    setNotesSaved(false);
  }, [conversationId]);

  // Carga las notas cuando llega la conversación seleccionada.
  const loadedId = conversation?.id;
  useEffect(() => {
    if (loadedId && loadedId === conversationId) {
      setNotesDraft(conversation?.notes ?? '');
    }
  }, [conversationId, loadedId]);

  const saveNotes = async (): Promise<void> => {
    await update.mutateAsync({ notes: notesDraft.trim() || null });
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  const ask = async (customPrompt?: string): Promise<void> => {
    const p = customPrompt ?? prompt;
    const result = await aiAssist.mutateAsync({
      conversationId: conversationId ?? undefined,
      prompt: p || undefined,
      mode: 'ask',
    });
    setAnswer(result.text);
  };

  const tags = conversation?.tags ?? [];
  const addTag = (t: string): void => {
    const clean = t.trim();
    if (!clean || tags.includes(clean)) return;
    void update.mutateAsync({ tags: [...tags, clean] });
    setNewTag('');
  };
  const removeTag = (t: string): void => {
    void update.mutateAsync({ tags: tags.filter((x) => x !== t) });
  };

  const property = conversation?.property;

  return (
    <aside className="hidden min-h-0 flex-col gap-4 overflow-y-auto xl:flex">
      {/* Datos del contacto */}
      <div className="rounded-xl border border-border bg-surface-raised p-4 shadow-elevation-1">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-content-muted">
          <UserRound className="h-4 w-4" /> Datos del contacto
        </p>
        <dl className="space-y-1.5">
          <InfoRow label="Nombre" value={conversation?.contactName ?? '—'} />
          <InfoRow label="Teléfono" value={conversation?.contactHandle ?? '—'} />
          {conversation?.client ? (
            <>
              {conversation.client.email && (
                <InfoRow label="Email" value={conversation.client.email} />
              )}
              <InfoRow
                label="Interés"
                value={temperatureLabel[conversation.client.temperature]?.label ?? '—'}
                valueClass={temperatureLabel[conversation.client.temperature]?.className}
              />
            </>
          ) : null}
        </dl>
        {conversation?.client ? (
          <Link
            href={`/clients/${conversation.client.id}`}
            className="mt-2 inline-block text-xs font-medium text-brand-deep hover:underline"
          >
            Ver ficha completa →
          </Link>
        ) : (
          <p className="mt-2 text-xs text-content-muted">
            Aún no está vinculado a un cliente del CRM.
          </p>
        )}
      </div>

      {/* Propiedad de interés */}
      <div className="rounded-xl border border-border bg-surface-raised p-4 shadow-elevation-1">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-content-muted">
          <Building2 className="h-4 w-4" /> Propiedad de interés
        </p>
        {property ? (
          <div className="space-y-3">
            {property.media.length > 0 && (
              <>
                <p className="text-[11px] font-medium uppercase tracking-wide text-content-muted">
                  Galería · {property.media.length} foto{property.media.length === 1 ? '' : 's'}
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {property.media.slice(0, 8).map((m) => (
                    <Link
                      key={m.id}
                      href={`/properties/${property.id}`}
                      className="relative aspect-square overflow-hidden rounded-md"
                    >
                      <Image
                        src={m.url}
                        alt={property.title}
                        fill
                        sizes="80px"
                        className="object-cover transition hover:scale-105"
                      />
                    </Link>
                  ))}
                </div>
              </>
            )}
            <dl className="space-y-1.5">
              <InfoRow label="Código" value={property.code} valueClass="text-brand-deep" />
              <InfoRow label="Nombre" value={property.title} />
              <InfoRow label="Tipo" value={property.propertyType ?? '—'} />
              <InfoRow
                label="Estado"
                value={propertyStatusLabel[property.status] ?? property.status}
              />
              {property.bedrooms != null && (
                <InfoRow label="Habitaciones" value={`${property.bedrooms} hab.`} />
              )}
              {property.bathrooms != null && (
                <InfoRow label="Baños" value={`${property.bathrooms} baños`} />
              )}
              <InfoRow
                label="Precio"
                value={formatMoney(property.price, property.currency)}
                valueClass="font-semibold text-brand-deep"
              />
            </dl>
            <Link
              href={`/properties/${property.id}`}
              className="inline-block text-xs font-medium text-brand-deep hover:underline"
            >
              Ver propiedad →
            </Link>
          </div>
        ) : (
          <p className="text-xs text-content-muted">
            Vincula la propiedad de la que habla este contacto.
          </p>
        )}
        <select
          value={property?.id ?? ''}
          onChange={(e) => void update.mutateAsync({ propertyId: e.target.value || null })}
          disabled={!conversationId}
          className="mt-3 h-9 w-full rounded-lg border border-border bg-surface-sunken px-2.5 text-xs text-content focus-visible:border-brand focus-visible:outline-none"
        >
          <option value="">— Sin propiedad —</option>
          {(propertiesData?.items ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} · {p.title}
            </option>
          ))}
        </select>
      </div>

      {/* Notas */}
      <div className="rounded-xl border border-border bg-surface-raised p-4 shadow-elevation-1">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-content-muted">
          <StickyNote className="h-4 w-4" /> Notas
        </p>
        <textarea
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          rows={3}
          disabled={!conversationId}
          placeholder="Apuntes internos sobre este contacto…"
          className="w-full resize-y rounded-lg border border-border bg-surface-sunken px-3 py-2 text-sm text-content placeholder:text-content-muted focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-success">{notesSaved ? '✓ Guardado' : ''}</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void saveNotes()}
            disabled={!conversationId || update.isPending}
          >
            Guardar nota
          </Button>
        </div>
      </div>

      {/* Etiquetas */}
      <div className="rounded-xl border border-border bg-surface-raised p-4 shadow-elevation-1">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-content-muted">
          <Tag className="h-4 w-4" /> Etiquetas
        </p>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => removeTag(t)}
              className="group inline-flex items-center gap-1 rounded-full bg-brand-tint px-2.5 py-1 text-xs font-medium text-brand-deep"
              title="Quitar etiqueta"
            >
              {t}
              <span className="text-brand-deep/50 group-hover:text-danger">×</span>
            </button>
          ))}
          {tags.length === 0 && <span className="text-xs text-content-muted">Sin etiquetas</span>}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            list="inbox-tags"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag(newTag);
              }
            }}
            placeholder="Añadir etiqueta…"
            disabled={!conversationId}
            className="h-8 flex-1 rounded-lg border border-border bg-surface-sunken px-2.5 text-xs text-content placeholder:text-content-muted focus-visible:border-brand focus-visible:outline-none"
          />
          <datalist id="inbox-tags">
            {allTags.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
          <button
            type="button"
            onClick={() => addTag(newTag)}
            disabled={!newTag.trim()}
            className="rounded-lg bg-surface-sunken px-2.5 text-xs font-medium text-content-secondary hover:bg-brand-tint hover:text-brand-deep disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        </div>
        {conversation && (
          <div className="mt-3 flex gap-1.5">
            {(['OPEN', 'PENDING', 'CLOSED'] as ConversationStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void update.mutateAsync({ status: s })}
                className={`flex-1 rounded-lg px-2 py-1 text-[11px] font-medium transition ${
                  conversation.status === s
                    ? 'bg-brand text-on-brand'
                    : 'bg-surface-sunken text-content-secondary hover:bg-brand-tint'
                }`}
              >
                {statusLabel[s]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Asistente Claude */}
      <div className="rounded-xl border border-[#4c5b8a]/30 bg-[#eceef5] p-4 dark:bg-[#1e2333]">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#4c5b8a] dark:text-[#aab4d4]">
          <Bot className="h-4 w-4" /> Asistente Claude
        </p>
        <p className="mb-3 text-xs text-content-muted">
          Pregúntale lo que sea sobre esta conversación o tus propiedades.
        </p>
        <div className="flex flex-wrap gap-1.5">
          <QuickAsk onClick={() => void ask('Resume esta conversación en 2 líneas.')}>
            Resumir
          </QuickAsk>
          <QuickAsk
            onClick={() => void ask('¿Cuál es la siguiente mejor acción con este contacto?')}
          >
            Siguiente acción
          </QuickAsk>
          <QuickAsk
            onClick={() => void ask('Recomiéndame 2 propiedades del CRM para este contacto.')}
          >
            Recomendar
          </QuickAsk>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={2}
          placeholder="Escribe tu consulta a Claude…"
          className="mt-3 w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button
          variant="brand"
          size="sm"
          className="mt-2 w-full"
          onClick={() => void ask()}
          disabled={aiAssist.isPending}
        >
          {aiAssist.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Preguntar a Claude
        </Button>
        {answer && (
          <div className="mt-3 whitespace-pre-wrap rounded-lg bg-surface-raised p-3 text-sm text-content shadow-elevation-1">
            {answer}
          </div>
        )}
        <AiTraining />
      </div>
    </aside>
  );
}

function AiTraining(): ReactNode {
  const { data } = useAiSettings();
  const update = useUpdateAiSettings();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);
  const loaded = data?.instructions;

  useEffect(() => {
    if (typeof loaded === 'string') setText(loaded);
  }, [loaded]);

  const save = async (): Promise<void> => {
    await update.mutateAsync(text);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mt-3 border-t border-[#4c5b8a]/20 pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-xs font-semibold text-[#4c5b8a] dark:text-[#aab4d4]"
      >
        <span className="inline-flex items-center gap-1.5">
          <GraduationCap className="h-3.5 w-3.5" />
          Entrenar al asistente
        </span>
        <span>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="mt-2">
          <p className="mb-2 text-[11px] text-content-muted">
            Escribe conocimiento del negocio que Claude usará siempre: horarios, formas de pago,
            financiamiento, comisión, tono de respuesta, políticas, etc.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder={
              'Ej. Atiendo de lunes a sábado de 9am a 7pm. Trabajo con crédito hipotecario de BCP e Interbank. Mi comisión es 3%. Siempre ofrezco agendar una visita.'
            }
            className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted focus-visible:border-brand focus-visible:outline-none"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-success">{saved ? '✓ Guardado' : ''}</span>
            <Button
              variant="brand"
              size="sm"
              onClick={() => void save()}
              disabled={update.isPending}
            >
              Guardar entrenamiento
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickAsk({ onClick, children }: { onClick: () => void; children: ReactNode }): ReactNode {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-[#4c5b8a]/30 bg-surface-raised px-2.5 py-1 text-[11px] font-medium text-[#4c5b8a] transition hover:bg-[#4c5b8a] hover:text-white dark:text-[#aab4d4]"
    >
      {children}
    </button>
  );
}
