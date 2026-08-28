// ==========================================
// ReplyFlow — Shared Frontend Types
// ==========================================

// ---------- User ----------
export interface User {
  id: string;
  name: string;
  email: string;
  defaultCountry: string;
  createdAt: string;
}

// ---------- WhatsApp ----------
export type WhatsAppSessionStatus =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'QR_REQUIRED'
  | 'CONNECTED'
  | 'ERROR';

export interface WhatsAppSession {
  id: string;
  userId: string;
  sessionName: string;
  status: WhatsAppSessionStatus;
  phoneNumber?: string | null;
  connectedAt?: string | null;
  lastSeenAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------- Contact ----------
export interface Contact {
  id: string;
  userId: string;
  phoneNumber: string;
  normalizedPhoneNumber: string;
  name?: string | null;
  email?: string | null;
  source?: string | null;
  isOptedOut: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------- Campaign ----------
export type CampaignStatus =
  | 'DRAFT'
  | 'QUEUED'
  | 'RUNNING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'STOPPED'
  | 'FAILED';

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  messageTemplate: string;
  whatsappSessionId: string;
  status: CampaignStatus;
  totalContacts: number;
  pendingCount: number;
  sentCount: number;
  deliveredCount: number;
  repliedCount: number;
  failedCount: number;
  delayMin: number;
  delayMax: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

// ---------- Campaign Contact ----------
export type CampaignContactStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SENT'
  | 'DELIVERED'
  | 'REPLIED'
  | 'FAILED'
  | 'SKIPPED';

export interface CampaignContact {
  id: string;
  campaignId: string;
  contactId: string;
  status: CampaignContactStatus;
  personalizedMessage?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  repliedAt?: string | null;
  failureReason?: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  contact?: Contact;
  campaign?: Campaign;
}

// ---------- Message ----------
export type MessageDirection = 'OUTBOUND' | 'INBOUND';
export type MessageStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export interface Message {
  id: string;
  campaignContactId: string;
  whatsappMessageId?: string | null;
  direction: MessageDirection;
  messageType: string;
  content: string;
  status: MessageStatus;
  sentAt?: string | null;
  receivedAt?: string | null;
  createdAt: string;
}

// ---------- Reply ----------
export interface Reply {
  id: string;
  campaignContactId: string;
  messageId?: string | null;
  contactId: string;
  content: string;
  receivedAt: string;
  createdAt: string;
}

// ---------- Files ----------
export interface ImportedFile {
  id: string;
  userId: string;
  fileName: string;
  originalFileName: string;
  fileType: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  createdAt: string;
}

export interface ExportedFile {
  id: string;
  userId: string;
  campaignId: string;
  fileName: string;
  originalFileName: string;
  fileSize?: number;
  createdAt: string;
}

// ---------- API ----------
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ---------- Inbox ----------
export interface InboxConversation {
  campaignContact: CampaignContact;
  contact: Contact;
  campaign: Campaign;
  lastMessage?: Message;
  replyCount: number;
  unread: boolean;
}

// ---------- Dashboard ----------
export interface DashboardStats {
  whatsappConnected: boolean;
  totalContacts: number;
  totalCampaigns: number;
  messagesSent: number;
  totalReplies: number;
  successRate: number;
}
