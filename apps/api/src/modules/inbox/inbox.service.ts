import { Injectable, NotFoundException } from '@nestjs/common';
import { type InboxChannel, Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { AiService } from '../ai/ai.service';

import type {
  AiAssistDto,
  ListConversationsDto,
  SendMessageDto,
  UpdateConversationDto,
} from './dto/inbox.dto';

type AutoMode = 'OFF' | 'AFTER_HOURS' | 'ALWAYS';

interface AiSettings {
  instructions: string;
  autoMode: AutoMode;
  hoursStart: number;
  hoursEnd: number;
  configured: boolean;
  model: string;
}

@Injectable()
export class InboxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  /** Bandeja: cuentas conectadas + conversaciones (filtradas) + contadores. */
  async overview(tenantId: string, query: ListConversationsDto) {
    await this.ensureSeed(tenantId);

    const where: Prisma.ConversationWhereInput = { tenantId };
    if (query.channel) where.channel = query.channel;
    if (query.status) where.status = query.status;
    if (query.tag) where.tags = { has: query.tag };
    if (query.q) {
      where.OR = [
        { contactName: { contains: query.q, mode: 'insensitive' } },
        { contactHandle: { contains: query.q, mode: 'insensitive' } },
        { lastPreview: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const [accounts, conversations, openCount, pendingCount, unreadAgg, tagRows] =
      await this.prisma.$transaction([
        this.prisma.channelAccount.findMany({
          where: { tenantId },
          orderBy: { channel: 'asc' },
        }),
        this.prisma.conversation.findMany({
          where,
          orderBy: { lastMessageAt: 'desc' },
          take: 100,
          include: {
            client: { select: { id: true, firstName: true, lastName: true, temperature: true } },
          },
        }),
        this.prisma.conversation.count({ where: { tenantId, status: 'OPEN' } }),
        this.prisma.conversation.count({ where: { tenantId, status: 'PENDING' } }),
        this.prisma.conversation.aggregate({ where: { tenantId }, _sum: { unread: true } }),
        this.prisma.conversation.findMany({ where: { tenantId }, select: { tags: true } }),
      ]);

    const tags = Array.from(new Set(tagRows.flatMap((row) => row.tags))).sort();

    return {
      accounts,
      conversations,
      tags,
      counts: {
        open: openCount,
        pending: pendingCount,
        unread: unreadAgg._sum.unread ?? 0,
        aiConfigured: this.ai.isConfigured,
      },
    };
  }

  async getConversation(tenantId: string, id: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, tenantId },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            temperature: true,
          },
        },
        property: {
          select: {
            id: true,
            code: true,
            title: true,
            propertyType: true,
            status: true,
            price: true,
            currency: true,
            district: true,
            bedrooms: true,
            bathrooms: true,
            media: {
              where: { type: 'IMAGE' },
              orderBy: [{ isCover: 'desc' }, { order: 'asc' }],
              take: 12,
              select: { id: true, url: true },
            },
          },
        },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!conversation) throw new NotFoundException('Conversación no encontrada');

    // Al abrir, se marca como leída.
    if (conversation.unread > 0) {
      await this.prisma.conversation.update({ where: { id }, data: { unread: 0 } });
    }
    return conversation;
  }

  async sendMessage(tenantId: string, id: string, dto: SendMessageDto) {
    await this.getOrThrow(tenantId, id);
    const message = await this.prisma.inboxMessage.create({
      data: {
        tenantId,
        conversationId: id,
        direction: 'OUTBOUND',
        author: 'AGENT',
        body: dto.body,
      },
    });
    await this.prisma.conversation.update({
      where: { id },
      data: { lastPreview: dto.body.slice(0, 140), lastMessageAt: new Date(), unread: 0 },
    });
    return message;
  }

  async updateConversation(tenantId: string, id: string, dto: UpdateConversationDto) {
    await this.getOrThrow(tenantId, id);
    if (dto.propertyId) {
      const property = await this.prisma.property.findFirst({
        where: { id: dto.propertyId, tenantId, deletedAt: null },
        select: { id: true },
      });
      if (!property) throw new NotFoundException('Propiedad no encontrada');
    }
    return this.prisma.conversation.update({
      where: { id },
      data: {
        status: dto.status,
        tags: dto.tags,
        clientId: dto.clientId === undefined ? undefined : dto.clientId,
        propertyId: dto.propertyId === undefined ? undefined : dto.propertyId,
        notes: dto.notes === undefined ? undefined : dto.notes,
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, temperature: true } },
      },
    });
  }

  /** Dashboard de leads (estilo Propify): temperatura, canales, fuentes, respuesta. */
  async leadsDashboard(tenantId: string, days: number) {
    const since =
      days === 1
        ? new Date(new Date().setHours(0, 0, 0, 0))
        : new Date(Date.now() - days * 86400000);

    const [conversations, buyers] = await this.prisma.$transaction([
      this.prisma.conversation.findMany({
        where: { tenantId },
        select: {
          channel: true,
          status: true,
          unread: true,
          createdAt: true,
          lastMessageAt: true,
          client: { select: { temperature: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { author: true },
          },
        },
      }),
      this.prisma.client.findMany({
        where: { tenantId, deletedAt: null, type: { in: ['BUYER', 'BOTH'] } },
        select: {
          temperature: true,
          source: true,
          createdAt: true,
          requirement: { select: { budgetMax: true } },
        },
      }),
    ]);

    const count = <T extends string>(items: T[]): Record<string, number> => {
      const acc: Record<string, number> = {};
      for (const item of items) acc[item] = (acc[item] ?? 0) + 1;
      return acc;
    };

    const active = conversations.filter((c) => c.status !== 'CLOSED');
    const lastAuthor = conversations
      .map((c) => c.messages[0]?.author)
      .filter((a): a is NonNullable<typeof a> => Boolean(a));
    const budgets = buyers
      .map((b) => b.requirement?.budgetMax)
      .filter((b): b is number => typeof b === 'number' && b > 0);

    return {
      summary: {
        activeConversations: active.length,
        newInPeriod: conversations.filter((c) => c.createdAt >= since).length,
        managedInPeriod: conversations.filter((c) => c.lastMessageAt >= since).length,
        pendingResponse: conversations.filter((c) => c.messages[0]?.author === 'CONTACT').length,
        unread: conversations.reduce((sum, c) => sum + c.unread, 0),
        hotLeads: buyers.filter((b) => b.temperature === 'HOT').length,
        withBudget: budgets.length,
        avgBudget: budgets.length
          ? Math.round(budgets.reduce((a, b) => a + b, 0) / budgets.length)
          : 0,
        totalLeads: buyers.length,
      },
      temperature: count(buyers.map((b) => b.temperature)),
      lastMessageBy: count(lastAuthor),
      byChannel: count(conversations.map((c) => c.channel)),
      byStatus: count(conversations.map((c) => c.status)),
      bySource: count(buyers.map((b) => b.source?.trim() || 'Sin fuente')),
    };
  }

  /** Configuración del asistente (conocimiento + automatización) — en tenant.settings. */
  async getAiSettings(tenantId: string): Promise<AiSettings> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });
    const s = (tenant?.settings ?? {}) as Record<string, unknown>;
    return {
      instructions: typeof s.aiInstructions === 'string' ? s.aiInstructions : '',
      autoMode: (['OFF', 'AFTER_HOURS', 'ALWAYS'] as const).includes(s.autoMode as AutoMode)
        ? (s.autoMode as AutoMode)
        : 'OFF',
      hoursStart: typeof s.hoursStart === 'number' ? s.hoursStart : 9,
      hoursEnd: typeof s.hoursEnd === 'number' ? s.hoursEnd : 19,
      configured: this.ai.isConfigured,
      model: this.ai.model,
    };
  }

  async updateAiSettings(
    tenantId: string,
    patch: Partial<Pick<AiSettings, 'instructions' | 'autoMode' | 'hoursStart' | 'hoursEnd'>>,
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });
    const settings = { ...((tenant?.settings ?? {}) as Record<string, unknown>) };
    if (patch.instructions !== undefined) settings.aiInstructions = patch.instructions;
    if (patch.autoMode !== undefined) settings.autoMode = patch.autoMode;
    if (patch.hoursStart !== undefined) settings.hoursStart = patch.hoursStart;
    if (patch.hoursEnd !== undefined) settings.hoursEnd = patch.hoursEnd;
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { settings: settings as Prisma.InputJsonObject },
    });
    return this.getAiSettings(tenantId);
  }

  /** Llega un mensaje del cliente (canal real o simulado): registra + intenta responder solo. */
  async receiveInbound(tenantId: string, id: string, body: string) {
    await this.getOrThrow(tenantId, id);
    await this.prisma.inboxMessage.create({
      data: { tenantId, conversationId: id, direction: 'INBOUND', author: 'CONTACT', body },
    });
    await this.prisma.conversation.update({
      where: { id },
      data: {
        lastPreview: body.slice(0, 140),
        lastMessageAt: new Date(),
        unread: { increment: 1 },
        status: 'OPEN',
      },
    });
    return this.maybeAutoReply(tenantId, id);
  }

  /** Decide si Claude responde solo, y si aplica lo hace; si no, escala a Faviola. */
  private async maybeAutoReply(tenantId: string, id: string) {
    const settings = await this.getAiSettings(tenantId);
    if (settings.autoMode === 'OFF') return { action: 'NONE' as const };
    if (settings.autoMode === 'AFTER_HOURS' && this.isBusinessHours(settings)) {
      return { action: 'NONE' as const };
    }
    if (!this.ai.isConfigured) {
      await this.escalate(id, 'Claude no está conectado (falta API key).');
      return { action: 'ESCALATE' as const, reason: 'IA no configurada' };
    }

    const decision = await this.decide(tenantId, id);
    if (decision.action === 'ANSWER' && decision.reply) {
      await this.prisma.inboxMessage.create({
        data: {
          tenantId,
          conversationId: id,
          direction: 'OUTBOUND',
          author: 'AI',
          body: decision.reply,
        },
      });
      await this.prisma.conversation.update({
        where: { id },
        data: { lastPreview: decision.reply.slice(0, 140), lastMessageAt: new Date(), unread: 0 },
      });
      return { action: 'ANSWER' as const, reply: decision.reply };
    }

    await this.escalate(id, decision.reason);
    return { action: 'ESCALATE' as const, reason: decision.reason };
  }

  /** Claude clasifica el último mensaje: responder solo o escalar a Faviola. */
  private async decide(
    tenantId: string,
    conversationId: string,
  ): Promise<{ action: 'ANSWER' | 'ESCALATE'; reply?: string; reason?: string }> {
    const context = await this.buildContext(tenantId, conversationId);
    const { instructions } = await this.getAiSettings(tenantId);

    const system = [
      'Eres el asistente de "Faviola Velarde — Asesoría Patrimonial" (inmobiliaria de Arequipa).',
      'Tu tarea: leer el ÚLTIMO mensaje del cliente y decidir si puedes responderlo tú solo o si debes escalarlo a Faviola.',
      '',
      'RESPONDE TÚ (action="ANSWER") solo si es una consulta informativa que puedes resolver con certeza usando los datos del CRM y las instrucciones del negocio: precio, dirección, características, disponibilidad, horarios, formas de pago, cómo funciona un crédito, dudas generales, saludo/agradecimiento.',
      'ESCALA A FAVIOLA (action="ESCALATE") si el mensaje implica: negociar precio o pedir descuento, cerrar/reservar la compra, agendar o confirmar una visita, temas legales o financieros delicados, una queja o reclamo, o cualquier dato que NO tengas en el contexto. Ante la duda, escala.',
      'Nunca inventes precios, direcciones ni propiedades que no aparezcan en el contexto.',
      'Responde SIEMPRE en español y SOLO con un JSON válido, sin texto adicional, con esta forma exacta:',
      '{"action":"ANSWER"|"ESCALATE","reply":"respuesta lista para enviar al cliente (solo si action=ANSWER)","reason":"motivo breve del escalamiento (solo si action=ESCALATE)"}',
      ...(instructions.trim()
        ? [
            '',
            '# Instrucciones y conocimiento del negocio (definidos por Faviola)',
            instructions.trim(),
          ]
        : []),
      '',
      context,
    ].join('\n');

    const result = await this.ai.complete({
      system,
      prompt: 'Analiza el último mensaje del cliente y devuelve solo el JSON de decisión.',
      maxTokens: 500,
    });

    const match = result.text.match(/\{[\s\S]*\}/);
    if (!match)
      return { action: 'ESCALATE', reason: 'No se pudo interpretar la respuesta de la IA.' };
    try {
      const parsed = JSON.parse(match[0]) as { action?: string; reply?: string; reason?: string };
      if (parsed.action === 'ANSWER' && parsed.reply?.trim()) {
        return { action: 'ANSWER', reply: parsed.reply.trim() };
      }
      return {
        action: 'ESCALATE',
        reason: parsed.reason?.trim() || 'Requiere criterio de Faviola.',
      };
    } catch {
      return { action: 'ESCALATE', reason: 'No se pudo interpretar la respuesta de la IA.' };
    }
  }

  private async escalate(id: string, reason?: string): Promise<void> {
    const conv = await this.prisma.conversation.findUnique({
      where: { id },
      select: { tags: true },
    });
    const tags = Array.from(new Set([...(conv?.tags ?? []), 'Requiere Faviola']));
    await this.prisma.conversation.update({
      where: { id },
      data: { status: 'PENDING', tags, notes: reason ? `IA escaló: ${reason}` : undefined },
    });
  }

  /** ¿Estamos en horario de oficina? (hora de Lima, UTC-5). */
  private isBusinessHours(settings: AiSettings): boolean {
    const limaHour = (new Date().getUTCHours() - 5 + 24) % 24;
    return limaHour >= settings.hoursStart && limaHour < settings.hoursEnd;
  }

  /** Asistente Claude: responde una consulta o sugiere una respuesta al cliente. */
  async assist(tenantId: string, dto: AiAssistDto) {
    const context = await this.buildContext(tenantId, dto.conversationId);
    const { instructions } = await this.getAiSettings(tenantId);

    const system = [
      'Eres el asistente virtual de "Faviola Velarde — Asesoría Patrimonial", una asesora inmobiliaria de Arequipa (Perú).',
      'Ayudas a responder consultas de clientes y preguntas internas del negocio.',
      'Responde en español, con tono cálido, cercano y profesional. Sé concreto y breve (no más de un par de párrafos).',
      'Usa la información del CRM que se te da a continuación. Si no tienes un dato, dilo con naturalidad y ofrece coordinar una llamada o visita.',
      'Nunca inventes precios ni propiedades que no aparezcan en el contexto.',
      ...(instructions.trim()
        ? [
            '',
            '# Instrucciones y conocimiento del negocio (definidos por Faviola)',
            instructions.trim(),
          ]
        : []),
      '',
      context,
    ].join('\n');

    const prompt =
      dto.mode === 'reply'
        ? dto.prompt?.trim() ||
          'Redacta una respuesta lista para enviar al cliente según el último mensaje de la conversación.'
        : dto.prompt?.trim() ||
          'Dame un resumen y la siguiente mejor acción para esta conversación.';

    const result = await this.ai.complete({ system, prompt });
    return result;
  }

  private async buildContext(tenantId: string, conversationId?: string): Promise<string> {
    const properties = await this.prisma.property.findMany({
      where: { tenantId, deletedAt: null, status: 'AVAILABLE' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        code: true,
        title: true,
        district: true,
        address: true,
        price: true,
        currency: true,
        operation: true,
        bedrooms: true,
        bathrooms: true,
        area: true,
        propertyType: true,
      },
    });

    const lines: string[] = ['# Propiedades disponibles (datos exactos del CRM)'];
    for (const p of properties) {
      lines.push(
        `- [${p.code}] ${p.title} · ${p.propertyType ?? 'Inmueble'} · ${p.operation === 'RENT' ? 'Alquiler' : 'Venta'} · ${p.currency} ${p.price.toLocaleString('es-PE')}` +
          ` · ${p.bedrooms ?? '-'} dorm / ${p.bathrooms ?? '-'} baños · ${p.area ? `${p.area} m²` : 'área s/d'}` +
          ` · Dirección: ${p.address ? `${p.address}, ` : ''}${p.district ?? 'Arequipa'}`,
      );
    }
    if (properties.length === 0) lines.push('- (Sin propiedades cargadas todavía)');

    if (conversationId) {
      const conversation = await this.prisma.conversation.findFirst({
        where: { id: conversationId, tenantId },
        include: {
          client: { select: { firstName: true, lastName: true, temperature: true } },
          property: {
            select: {
              code: true,
              title: true,
              district: true,
              address: true,
              price: true,
              currency: true,
              propertyType: true,
              status: true,
              bedrooms: true,
              bathrooms: true,
              area: true,
              description: true,
            },
          },
          messages: { orderBy: { createdAt: 'asc' }, take: 20 },
        },
      });
      if (conversation) {
        lines.push('', '# Conversación actual');
        lines.push(`Contacto: ${conversation.contactName} (canal ${conversation.channel})`);
        if (conversation.client) {
          lines.push(
            `Cliente en CRM: ${conversation.client.firstName} ${conversation.client.lastName} · interés ${conversation.client.temperature}`,
          );
        }
        if (conversation.property) {
          const prop = conversation.property;
          lines.push(
            `Propiedad de interés [${prop.code}]: ${prop.title} · ${prop.propertyType ?? 'Inmueble'} · ${prop.currency} ${prop.price.toLocaleString('es-PE')} · estado ${prop.status}` +
              ` · ${prop.bedrooms ?? '-'} dormitorios / ${prop.bathrooms ?? '-'} baños · ${prop.area ? `${prop.area} m²` : 'área s/d'}` +
              ` · Dirección exacta: ${prop.address ? `${prop.address}, ` : ''}${prop.district ?? 'Arequipa'}`,
          );
          if (prop.description) lines.push(`Descripción: ${prop.description}`);
        }
        if (conversation.notes) {
          lines.push(`Notas internas de Faviola: ${conversation.notes}`);
        }
        lines.push('Historial:');
        for (const m of conversation.messages) {
          const who = m.author === 'CONTACT' ? 'Cliente' : m.author === 'AI' ? 'IA' : 'Faviola';
          lines.push(`  ${who}: ${m.body}`);
        }
      }
    }

    return lines.join('\n');
  }

  private async getOrThrow(tenantId: string, id: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!conversation) throw new NotFoundException('Conversación no encontrada');
    return conversation;
  }

  // ─── Datos demo (solo la primera vez, si la bandeja está vacía) ───────────
  private async ensureSeed(tenantId: string): Promise<void> {
    const existing = await this.prisma.conversation.count({ where: { tenantId } });
    if (existing > 0) return;

    const accounts: Array<{
      channel: InboxChannel;
      displayName: string;
      handle: string;
      status: 'CONNECTED' | 'PENDING';
    }> = [
      {
        channel: 'WHATSAPP',
        displayName: 'WhatsApp Business',
        handle: '+51 986 445 884',
        status: 'CONNECTED',
      },
      {
        channel: 'INSTAGRAM',
        displayName: 'Instagram',
        handle: '@faviola.velarde',
        status: 'CONNECTED',
      },
      {
        channel: 'FACEBOOK',
        displayName: 'Facebook',
        handle: 'Faviola Velarde Asesoría',
        status: 'CONNECTED',
      },
      { channel: 'TIKTOK', displayName: 'TikTok', handle: '@faviolavelarde', status: 'PENDING' },
    ];
    await this.prisma.channelAccount.createMany({
      data: accounts.map((a) => ({ tenantId, ...a })),
      skipDuplicates: true,
    });

    const clients = await this.prisma.client.findMany({
      where: { tenantId, deletedAt: null, type: { in: ['BUYER', 'BOTH'] } },
      orderBy: { createdAt: 'asc' },
      take: 4,
      select: { id: true, firstName: true, lastName: true },
    });

    const properties = await this.prisma.property.findMany({
      where: { tenantId, deletedAt: null, status: 'AVAILABLE' },
      orderBy: { createdAt: 'asc' },
      take: 4,
      select: { id: true },
    });

    const now = Date.now();
    const min = (n: number) => new Date(now - n * 60000);

    type Seed = {
      channel: InboxChannel;
      contactName: string;
      contactHandle: string;
      clientId?: string;
      propertyId?: string;
      status: 'OPEN' | 'PENDING' | 'CLOSED';
      tags: string[];
      unread: number;
      minutesAgo: number;
      messages: Array<{ author: 'CONTACT' | 'AGENT'; body: string; minutesAgo: number }>;
    };

    const seeds: Seed[] = [
      {
        channel: 'WHATSAPP',
        contactName: clients[0]
          ? `${clients[0].firstName} ${clients[0].lastName}`
          : 'Lucía Fernández',
        contactHandle: '+51 981 445 566',
        clientId: clients[0]?.id,
        propertyId: properties[0]?.id,
        status: 'OPEN',
        tags: ['Comprador', 'Yanahuara'],
        unread: 2,
        minutesAgo: 6,
        messages: [
          {
            author: 'CONTACT',
            body: 'Hola Faviola, vi el departamento de Yanahuara en tu página, ¿sigue disponible?',
            minutesAgo: 30,
          },
          {
            author: 'AGENT',
            body: '¡Hola Lucía! Sí, sigue disponible. ¿Te gustaría agendar una visita esta semana?',
            minutesAgo: 24,
          },
          {
            author: 'CONTACT',
            body: 'Me encantaría 😍 ¿el jueves en la tarde se podría?',
            minutesAgo: 8,
          },
          { author: 'CONTACT', body: '¿Y cuál sería el precio final?', minutesAgo: 6 },
        ],
      },
      {
        channel: 'INSTAGRAM',
        contactName: 'Sofía Mendoza',
        contactHandle: '@sofi.mendoza',
        clientId: clients[3]?.id,
        propertyId: properties[3]?.id,
        status: 'OPEN',
        tags: ['Instagram', 'Premium'],
        unread: 1,
        minutesAgo: 40,
        messages: [
          {
            author: 'CONTACT',
            body: 'Holaa, me interesa el depa premium con vista que publicaste 🏙️',
            minutesAgo: 55,
          },
          {
            author: 'AGENT',
            body: '¡Hola Sofía! Claro, es en Yanahuara, 3 dormitorios con terraza. ¿Te envío el brochure?',
            minutesAgo: 48,
          },
          { author: 'CONTACT', body: 'Sí porfa, y si aceptan crédito hipotecario', minutesAgo: 40 },
        ],
      },
      {
        channel: 'FACEBOOK',
        contactName: 'Jorge Ramírez',
        contactHandle: 'Jorge Ramírez',
        clientId: clients[1]?.id,
        propertyId: properties[1]?.id,
        status: 'PENDING',
        tags: ['Casa', 'Cayma'],
        unread: 0,
        minutesAgo: 180,
        messages: [
          {
            author: 'CONTACT',
            body: 'Buen día, busco una casa amplia en Cayma para mi familia.',
            minutesAgo: 240,
          },
          {
            author: 'AGENT',
            body: 'Buen día Jorge, tengo una casa de 4 dormitorios con jardín en Cayma. ¿Cuál es su presupuesto aproximado?',
            minutesAgo: 180,
          },
        ],
      },
      {
        channel: 'WHATSAPP',
        contactName: 'Andrea Pinto',
        contactHandle: '+51 983 667 788',
        clientId: clients[2]?.id,
        propertyId: properties[2]?.id,
        status: 'OPEN',
        tags: ['Primer depa'],
        unread: 1,
        minutesAgo: 95,
        messages: [
          {
            author: 'CONTACT',
            body: 'Hola, soy Andrea. ¿Tienes departamentos económicos en el centro?',
            minutesAgo: 120,
          },
          {
            author: 'AGENT',
            body: '¡Hola Andrea! Sí, tengo uno en el Cercado a S/ 320,000, 2 dormitorios. ¿Te interesa?',
            minutesAgo: 100,
          },
          {
            author: 'CONTACT',
            body: '¡Perfecto! ¿Se puede visitar este fin de semana?',
            minutesAgo: 95,
          },
        ],
      },
      {
        channel: 'INSTAGRAM',
        contactName: 'Valeria Chávez',
        contactHandle: '@vale.chavez',
        status: 'OPEN',
        tags: ['Nuevo lead'],
        unread: 1,
        minutesAgo: 15,
        messages: [
          {
            author: 'CONTACT',
            body: 'Hola! Vi tu taller de la Academia FV, ¿cuándo es el próximo? 🙌',
            minutesAgo: 15,
          },
        ],
      },
    ];

    for (const s of seeds) {
      await this.prisma.conversation.create({
        data: {
          tenantId,
          channel: s.channel,
          contactName: s.contactName,
          contactHandle: s.contactHandle,
          clientId: s.clientId,
          propertyId: s.propertyId,
          status: s.status,
          tags: s.tags,
          unread: s.unread,
          lastMessageAt: min(s.minutesAgo),
          lastPreview: s.messages[s.messages.length - 1]?.body.slice(0, 140),
          messages: {
            create: s.messages.map((m) => ({
              tenantId,
              direction: m.author === 'CONTACT' ? 'INBOUND' : 'OUTBOUND',
              author: m.author,
              body: m.body,
              createdAt: min(m.minutesAgo),
            })),
          },
        },
      });
    }
  }
}
