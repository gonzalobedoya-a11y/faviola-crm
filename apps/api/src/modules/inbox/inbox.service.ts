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
    return this.prisma.conversation.update({
      where: { id },
      data: {
        status: dto.status,
        tags: dto.tags,
        clientId: dto.clientId === undefined ? undefined : dto.clientId,
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, temperature: true } },
      },
    });
  }

  /** Asistente Claude: responde una consulta o sugiere una respuesta al cliente. */
  async assist(tenantId: string, dto: AiAssistDto) {
    const context = await this.buildContext(tenantId, dto.conversationId);

    const system = [
      'Eres el asistente virtual de "Faviola Velarde — Asesoría Patrimonial", una asesora inmobiliaria de Arequipa (Perú).',
      'Ayudas a responder consultas de clientes y preguntas internas del negocio.',
      'Responde en español, con tono cálido, cercano y profesional. Sé concreto y breve (no más de un par de párrafos).',
      'Usa la información del CRM que se te da a continuación. Si no tienes un dato, dilo con naturalidad y ofrece coordinar una llamada o visita.',
      'Nunca inventes precios ni propiedades que no aparezcan en el contexto.',
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
      take: 8,
      select: {
        title: true,
        district: true,
        price: true,
        currency: true,
        operation: true,
        bedrooms: true,
        bathrooms: true,
        propertyType: true,
      },
    });

    const lines: string[] = ['# Propiedades disponibles'];
    for (const p of properties) {
      lines.push(
        `- ${p.title} · ${p.propertyType ?? 'Inmueble'} en ${p.district ?? 'Arequipa'} · ${p.operation === 'RENT' ? 'Alquiler' : 'Venta'} · ${p.currency} ${p.price.toLocaleString('es-PE')} · ${p.bedrooms ?? '-'} dorm / ${p.bathrooms ?? '-'} baños`,
      );
    }
    if (properties.length === 0) lines.push('- (Sin propiedades cargadas todavía)');

    if (conversationId) {
      const conversation = await this.prisma.conversation.findFirst({
        where: { id: conversationId, tenantId },
        include: {
          client: { select: { firstName: true, lastName: true, temperature: true } },
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

    const now = Date.now();
    const min = (n: number) => new Date(now - n * 60000);

    type Seed = {
      channel: InboxChannel;
      contactName: string;
      contactHandle: string;
      clientId?: string;
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
