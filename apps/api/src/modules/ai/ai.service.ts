import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../config/env.validation';

interface CompleteOptions {
  system: string;
  prompt: string;
  maxTokens?: number;
}

/**
 * Puente con la API de Claude (Anthropic).
 * - Si no hay ANTHROPIC_API_KEY, no rompe: devuelve `configured: false`
 *   y un texto guía para configurarla.
 * - El modelo es configurable con ANTHROPIC_MODEL.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly config: ConfigService<Env, true>) {}

  get isConfigured(): boolean {
    return Boolean(this.config.get('ANTHROPIC_API_KEY', { infer: true }));
  }

  async complete({ system, prompt, maxTokens = 700 }: CompleteOptions): Promise<{
    text: string;
    configured: boolean;
  }> {
    const apiKey = this.config.get('ANTHROPIC_API_KEY', { infer: true });
    if (!apiKey) {
      return {
        configured: false,
        text: 'El asistente de Claude aún no está conectado. Carga tu ANTHROPIC_API_KEY en el servidor (Railway → Variables) para activarlo. Mientras tanto, puedes escribir tu respuesta manualmente.',
      };
    }

    const model = this.config.get('ANTHROPIC_MODEL', { infer: true });
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          system,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        this.logger.warn(`Anthropic ${response.status}: ${detail.slice(0, 300)}`);
        return {
          configured: true,
          text: 'No pude conectar con Claude en este momento. Revisa la API key o inténtalo de nuevo en unos segundos.',
        };
      }

      const data = (await response.json()) as {
        content?: Array<{ type: string; text?: string }>;
      };
      const text = (data.content ?? [])
        .filter((block) => block.type === 'text' && block.text)
        .map((block) => block.text)
        .join('\n')
        .trim();

      return { configured: true, text: text || 'Sin respuesta.' };
    } catch (error) {
      this.logger.error(`Error llamando a Anthropic: ${(error as Error).message}`);
      return {
        configured: true,
        text: 'Ocurrió un error al consultar a Claude. Inténtalo nuevamente.',
      };
    }
  }
}
