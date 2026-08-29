import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState, 
  fetchLatestBaileysVersion,
  delay
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import path from 'path';
import fs from 'fs/promises';
import { env } from '../../config/env.js';
import { WhatsAppProvider } from '../interfaces/provider.js';

export class BaileysProvider implements WhatsAppProvider {
  private sockets = new Map<string, ReturnType<typeof makeWASocket>>();
  private qrCodes = new Map<string, string>();
  private statuses = new Map<string, string>();

  async initialize(sessionId: string, onUpdate: (update: any) => void): Promise<void> {
    const authDir = path.join(env.WHATSAPP_AUTH_DIR, sessionId);
    
    // Ensure dir exists
    await fs.mkdir(authDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      browser: ['ReplyFlow', 'Chrome', '1.0.0'],
    });

    this.sockets.set(sessionId, sock);
    this.statuses.set(sessionId, 'CONNECTING');

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update: any) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        this.qrCodes.set(sessionId, qr);
        this.statuses.set(sessionId, 'QR_REQUIRED');
        onUpdate({ status: 'QR_REQUIRED', qr });
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        this.statuses.set(sessionId, 'DISCONNECTED');
        this.qrCodes.delete(sessionId);
        onUpdate({ status: 'DISCONNECTED', shouldReconnect });
        
        if (shouldReconnect) {
          setTimeout(() => this.initialize(sessionId, onUpdate), 5000);
        } else {
          // Logged out (from phone or dashboard), clear auth dir
          this.sockets.delete(sessionId);
          fs.rm(authDir, { recursive: true, force: true }).catch(console.error);
        }
      } else if (connection === 'open') {
        this.statuses.set(sessionId, 'CONNECTED');
        this.qrCodes.delete(sessionId);
        
        // Try to get user phone number
        const userJid = sock.user?.id;
        const phoneNumber = userJid ? userJid.split(':')[0] : undefined;
        
        onUpdate({ status: 'CONNECTED', phoneNumber });
      }
    });
    
    sock.ev.on('messages.upsert', (m: any) => {
      onUpdate({ type: 'messages.upsert', data: m });
    });

    sock.ev.on('contacts.upsert', (contacts: any[]) => {
      onUpdate({ type: 'contacts.upsert', data: contacts });
    });

    sock.ev.on('contacts.set' as any, (data: any) => {
      const list = Array.isArray(data) ? data : (data?.contacts || []);
      if (list.length > 0) onUpdate({ type: 'contacts.upsert', data: list });
    });

    sock.ev.on('contacts.update', (contacts: any[]) => {
      onUpdate({ type: 'contacts.upsert', data: contacts });
    });

    sock.ev.on('messaging-history.set', (history: any) => {
      // Contacts from history
      if (history?.contacts && Array.isArray(history.contacts)) {
        onUpdate({ type: 'contacts.upsert', data: history.contacts });
      }
      // Chats from history  
      if (history?.chats && Array.isArray(history.chats)) {
        onUpdate({ type: 'chats.upsert', data: history.chats });
      }
      // Messages from history - these come as WAMessage[] wrapped in objects
      if (history?.messages && Array.isArray(history.messages)) {
        // Baileys v6 wraps messages like [{messages: [WAMessage,...], ...}] 
        // or just plain WAMessage[]
        const allMessages: any[] = [];
        for (const item of history.messages) {
          if (item?.messages && Array.isArray(item.messages)) {
            // Wrapped format: { messages: WAMessage[] }
            allMessages.push(...item.messages);
          } else if (item?.key) {
            // Plain WAMessage format
            allMessages.push(item);
          }
        }
        if (allMessages.length > 0) {
          onUpdate({ type: 'history.messages', data: allMessages });
        }
      }
    });

    sock.ev.on('chats.set' as any, (data: any) => {
      const list = Array.isArray(data) ? data : (data?.chats || []);
      if (list.length > 0) onUpdate({ type: 'chats.upsert', data: list });
    });

    sock.ev.on('chats.upsert', (chats: any[]) => {
      onUpdate({ type: 'chats.upsert', data: chats });
    });
  }

  async sendMessage(sessionId: string, to: string, content: string): Promise<string | undefined> {
    const sock = this.sockets.get(sessionId);
    if (!sock) throw new Error('WhatsApp session not connected');

    const jid = to.includes('@s.whatsapp.net') ? to : `${to.replace('+', '')}@s.whatsapp.net`;
    
    const sentMsg = await sock.sendMessage(jid, { text: content });
    return sentMsg?.key?.id || undefined;
  }
  
  async sendTyping(sessionId: string, to: string): Promise<void> {
    const sock = this.sockets.get(sessionId);
    if (!sock) return;
    
    const jid = to.includes('@s.whatsapp.net') ? to : `${to.replace('+', '')}@s.whatsapp.net`;
    await sock.sendPresenceUpdate('composing', jid);
    await delay(2000);
    await sock.sendPresenceUpdate('paused', jid);
  }

  async disconnect(sessionId: string): Promise<void> {
    const sock = this.sockets.get(sessionId);
    if (sock) {
      await sock.logout('Logout triggered by user');
    }
  }

  getQrCode(sessionId: string): string | null {
    return this.qrCodes.get(sessionId) || null;
  }

  getStatus(sessionId: string): string {
    return this.statuses.get(sessionId) || 'DISCONNECTED';
  }
}
