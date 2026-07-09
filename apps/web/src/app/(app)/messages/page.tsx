'use client';

import {
  Bot,
  Check,
  Facebook,
  Instagram,
  Loader2,
  MessageCircle,
  Music2,
  Search,
  Send,
  Sparkles,
  Tag,
  UserRound,
  Wand2,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  useAiAssist,
  useConversation,
  useInbox,
  useSendMessage,
  useUpdateConversation,
} from '@/features/inbox/api';
import type {
  ChannelStatus,
  ConversationStatus,
  InboxChannel,
  InboxMessage,
} from '@/features/inbox/types';

const channelMeta: Record<
  InboxChannel,
  { label: string; icon: typeof MessageCircle; color: string; bg: string }
> = {
  WHATSAPP: { label: 'WhatsApp', icon: MessageCircle, color: '#128C4B', bg: '#e6f5ec' },
  INSTAGRAM: { label: 'Instagram', icon: Instagram, color: '#C13584', bg: '#fbe9f3' },
  FACEBOOK: { label: 'Facebook', icon: Facebook, color: '#1877F2', bg: '#e7f0fe' },
  TIKTOK: { label: 'TikTok', icon: Music2, color: '#1b1a18', bg: '#efece6' },
  INTERNAL: { label: 'Interno', icon: MessageCircle, color: '#a9884e', bg: '#f1e7d4' },
};

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
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useInbox({ channel, q: q.trim() || undefined });
  const conversations = data?.conversations ?? [];

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
            const Icon = meta.icon;
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
                <Icon className="h-3.5 w-3.5" />
                {meta.label}
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: connected ? '#3faa6a' : '#c8a54a' }}
                />
              </span>
            );
          })}
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
            <div className="flex flex-wrap gap-1.5">
              <FilterChip active={!channel} onClick={() => setChannel(undefined)}>
                Todos
              </FilterChip>
              {(['WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'TIKTOK'] as InboxChannel[]).map((c) => (
                <FilterChip key={c} active={channel === c} onClick={() => setChannel(c)}>
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
                const Icon = meta.icon;
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
                      <span
                        className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-surface-raised"
                        style={{ background: meta.color }}
                      >
                        <Icon className="h-2.5 w-2.5 text-white" />
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
      className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
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
          <p className="truncate text-xs text-content-muted">
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

function ContextPanel({
  conversationId,
  allTags,
}: {
  conversationId: string | null;
  allTags: string[];
}): ReactNode {
  const { data: conversation } = useConversation(conversationId);
  const update = useUpdateConversation(conversationId ?? '');
  const aiAssist = useAiAssist();
  const [prompt, setPrompt] = useState('');
  const [answer, setAnswer] = useState('');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    setAnswer('');
    setPrompt('');
  }, [conversationId]);

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

  return (
    <aside className="hidden min-h-0 flex-col gap-4 overflow-y-auto xl:flex">
      {/* Cliente */}
      <div className="rounded-xl border border-border bg-surface-raised p-4 shadow-elevation-1">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-content-muted">
          <UserRound className="h-4 w-4" /> Contacto
        </p>
        {conversation?.client ? (
          <div className="space-y-2">
            <Link
              href={`/clients/${conversation.client.id}`}
              className="text-sm font-semibold text-content hover:text-brand-deep"
            >
              {conversation.client.firstName} {conversation.client.lastName}
            </Link>
            <p
              className={`text-xs font-medium ${temperatureLabel[conversation.client.temperature]?.className}`}
            >
              Interés {temperatureLabel[conversation.client.temperature]?.label}
            </p>
            {conversation.client.phone && (
              <p className="text-xs text-content-muted">{conversation.client.phone}</p>
            )}
            {conversation.client.email && (
              <p className="text-xs text-content-muted">{conversation.client.email}</p>
            )}
            <Link
              href={`/clients/${conversation.client.id}`}
              className="inline-block text-xs font-medium text-brand-deep hover:underline"
            >
              Ver ficha completa →
            </Link>
          </div>
        ) : (
          <p className="text-sm text-content-muted">
            {conversation?.contactName ?? 'Sin contacto'} — aún no está vinculado a un cliente del
            CRM.
          </p>
        )}
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
      </div>
    </aside>
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
