import { io, type Socket } from 'socket.io-client';

interface ServerToClientEvents {
  'whatsapp:qr': (data: { sessionId: string; qr: string }) => void;
  'whatsapp:connecting': (data: { sessionId: string }) => void;
  'whatsapp:connected': (data: { sessionId: string; phoneNumber: string }) => void;
  'whatsapp:disconnected': (data: { sessionId: string; reason: string }) => void;
  'campaign:started': (data: { campaignId: string }) => void;
  'campaign:paused': (data: { campaignId: string }) => void;
  'campaign:resumed': (data: { campaignId: string }) => void;
  'campaign:stopped': (data: { campaignId: string }) => void;
  'campaign:progress': (data: { campaignId: string; stats: Record<string, number> }) => void;
  'message:sent': (data: { campaignId: string; contactId: string; messageId: string }) => void;
  'message:delivered': (data: { campaignId: string; contactId: string }) => void;
  'message:failed': (data: { campaignId: string; contactId: string; reason: string }) => void;
  'reply:received': (data: { campaignId: string; contactId: string; content: string; receivedAt: string }) => void;
  'reply:opt-out': (data: { contactId: string; phoneNumber: string }) => void;
  'export:ready': (data: { exportId: string; campaignId: string }) => void;
}

interface ClientToServerEvents {
  'subscribe:campaign': (data: { campaignId: string }) => void;
  'unsubscribe:campaign': (data: { campaignId: string }) => void;
}

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export const socket: AppSocket = io('/', {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

export function connectSocket(token: string) {
  socket.auth = { token };
  socket.connect();
}

export function disconnectSocket() {
  socket.disconnect();
}
