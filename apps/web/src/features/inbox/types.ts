export type InboxChannel = 'WHATSAPP' | 'INSTAGRAM' | 'FACEBOOK' | 'TIKTOK' | 'INTERNAL';
export type ChannelStatus = 'CONNECTED' | 'PENDING' | 'DISCONNECTED';
export type ConversationStatus = 'OPEN' | 'PENDING' | 'CLOSED';
export type MessageDirection = 'INBOUND' | 'OUTBOUND';
export type MessageAuthor = 'CONTACT' | 'AGENT' | 'AI';

export interface ChannelAccount {
  id: string;
  channel: InboxChannel;
  displayName: string;
  handle?: string | null;
  status: ChannelStatus;
}

export interface ConversationClient {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  temperature: 'HOT' | 'WARM' | 'COLD';
}

export interface ConversationListItem {
  id: string;
  channel: InboxChannel;
  contactName: string;
  contactHandle?: string | null;
  status: ConversationStatus;
  tags: string[];
  lastPreview?: string | null;
  lastMessageAt: string;
  unread: number;
  client?: Pick<ConversationClient, 'id' | 'firstName' | 'lastName' | 'temperature'> | null;
}

export interface InboxMessage {
  id: string;
  direction: MessageDirection;
  author: MessageAuthor;
  body: string;
  createdAt: string;
}

export interface InboxProperty {
  id: string;
  code: string;
  title: string;
  propertyType?: string | null;
  status: string;
  price: number;
  currency: string;
  district?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  media: Array<{ id: string; url: string }>;
}

export interface ConversationDetail extends ConversationListItem {
  client?: ConversationClient | null;
  property?: InboxProperty | null;
  notes?: string | null;
  messages: InboxMessage[];
}

export interface InboxOverview {
  accounts: ChannelAccount[];
  conversations: ConversationListItem[];
  tags: string[];
  counts: { open: number; pending: number; unread: number; aiConfigured: boolean };
}

export interface AiResult {
  text: string;
  configured: boolean;
}

export interface LeadsDashboard {
  summary: {
    activeConversations: number;
    newInPeriod: number;
    managedInPeriod: number;
    pendingResponse: number;
    unread: number;
    hotLeads: number;
    withBudget: number;
    avgBudget: number;
    totalLeads: number;
  };
  temperature: Record<string, number>;
  lastMessageBy: Record<string, number>;
  byChannel: Record<string, number>;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
}

export interface InboxFilters {
  channel?: InboxChannel;
  status?: ConversationStatus;
  tag?: string;
  q?: string;
}
