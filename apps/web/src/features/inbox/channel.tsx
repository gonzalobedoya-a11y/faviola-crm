import { Facebook, Instagram, MessageCircle, Music2 } from 'lucide-react';
import Image from 'next/image';
import type { ReactNode } from 'react';

import type { InboxChannel } from './types';

export const channelMeta: Record<
  InboxChannel,
  { label: string; icon: typeof MessageCircle; color: string; bg: string; logo?: string }
> = {
  WHATSAPP: {
    label: 'WhatsApp',
    icon: MessageCircle,
    color: '#128C4B',
    bg: '#e6f5ec',
    logo: '/brand/channels/whatsapp.jpg',
  },
  INSTAGRAM: {
    label: 'Instagram',
    icon: Instagram,
    color: '#C13584',
    bg: '#fbe9f3',
    logo: '/brand/channels/instagram.png',
  },
  FACEBOOK: {
    label: 'Facebook',
    icon: Facebook,
    color: '#1877F2',
    bg: '#e7f0fe',
    logo: '/brand/channels/facebook.jpg',
  },
  TIKTOK: {
    label: 'TikTok',
    icon: Music2,
    color: '#1b1a18',
    bg: '#efece6',
    logo: '/brand/channels/tiktok.png',
  },
  INTERNAL: { label: 'Interno', icon: MessageCircle, color: '#a9884e', bg: '#f1e7d4' },
};

/** Logo oficial del canal (con zoom para ocultar bordes de los .jpg). */
export function ChannelLogo({ channel, size }: { channel: InboxChannel; size: number }): ReactNode {
  const meta = channelMeta[channel];
  if (!meta.logo) {
    const Icon = meta.icon;
    return <Icon style={{ width: size * 0.72, height: size * 0.72, color: meta.color }} />;
  }
  return (
    <span
      className="relative inline-block shrink-0 overflow-hidden rounded-[26%]"
      style={{ width: size, height: size }}
    >
      <Image
        src={meta.logo}
        alt={meta.label}
        fill
        sizes={`${size}px`}
        className="scale-[1.18] object-cover"
      />
    </span>
  );
}
