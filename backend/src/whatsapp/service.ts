import { BaileysProvider } from './providers/baileys.js';
import WhatsAppSession from '../models/WhatsAppSession.js';
import Contact from '../models/Contact.js';
import CampaignContact from '../models/CampaignContact.js';
import Campaign from '../models/Campaign.js';
import Reply from '../models/Reply.js';
import Chat from '../models/Chat.js';
import ChatMessage from '../models/ChatMessage.js';
import { logger } from '../lib/logger.js';
import { getIO } from '../socket/index.js';
import { normalizePhoneNumber } from '../utils/phone.utils.js';

class WhatsAppService {
  private provider = new BaileysProvider();
  
  async startSession(sessionId: string, userId: string) {
    await this.provider.initialize(sessionId, async (update) => {
      if (update.status) {
        logger.info(`WhatsApp session ${sessionId} status: ${update.status}`);
        
        await WhatsAppSession.findByIdAndUpdate(sessionId, {
          status: update.status,
          phoneNumber: update.phoneNumber || undefined,
          connectedAt: update.status === 'CONNECTED' ? new Date() : undefined,
        });

        const io = getIO();
        io.to(`user:${userId}`).emit('whatsapp:status', { sessionId, status: update.status, qr: update.qr, phoneNumber: update.phoneNumber });
      }

      if (update.type === 'messages.upsert') {
        await this.handleIncomingMessages(sessionId, update.data);
      }
      
      if (update.type === 'contacts.upsert') {
        logger.info(`[SYNC] contacts.upsert received for session ${sessionId} — ${Array.isArray(update.data) ? update.data.length : 'non-array'} items`);
        if (Array.isArray(update.data) && update.data.length > 0) {
          logger.info(`[SYNC] First contact sample: ${JSON.stringify(update.data[0]).substring(0, 200)}`);
        }
        await this.handleContactsUpsert(sessionId, update.data);
      }

      if (update.type === 'chats.upsert') {
        logger.info(`[SYNC] chats.upsert received for session ${sessionId} — ${Array.isArray(update.data) ? update.data.length : 'non-array'} items`);
        if (Array.isArray(update.data) && update.data.length > 0) {
          logger.info(`[SYNC] First chat sample: ${JSON.stringify(update.data[0]).substring(0, 200)}`);
        }
        await this.handleChatsUpsert(sessionId, update.data);
      }

      if (update.type === 'history.messages') {
        logger.info(`[SYNC] history.messages received for session ${sessionId} — ${Array.isArray(update.data) ? update.data.length : 'non-array'} items`);
        await this.handleHistoryMessages(sessionId, update.data);
      }
    });
  }

  private async handleContactsUpsert(sessionId: string, contacts: any[]) {
    try {
      if (!Array.isArray(contacts) || contacts.length === 0) return;
      const session = await WhatsAppSession.findById(sessionId).select('userId');
      if (!session) return;
      
      const userId = session.userId;
      let count = 0;

      for (const c of contacts) {
        const jid = c?.id || c?.jid;
        if (!jid || typeof jid !== 'string') continue;
        if (jid.includes('@g.us')) continue; // Skip groups
        if (!jid.includes('@s.whatsapp.net')) continue;
        
        const rawPhone = jid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
        if (!rawPhone || rawPhone.length < 7) continue;

        let normalizedPhone = normalizePhoneNumber(`+${rawPhone}`) || normalizePhoneNumber(rawPhone, 'PK');
        if (!normalizedPhone) normalizedPhone = `+${rawPhone}`;

        const name = c.name || c.notify || c.verifiedName || rawPhone;
        
        await Contact.findOneAndUpdate(
          { userId, normalizedPhoneNumber: normalizedPhone },
          { 
            $setOnInsert: { 
              userId, 
              phoneNumber: rawPhone, 
              normalizedPhoneNumber: normalizedPhone,
              source: 'WHATSAPP_SYNC'
            },
            $set: { name }
          },
          { upsert: true, returnDocument: 'after' }
        );
        count++;
      }

      if (count > 0) {
        logger.info(`Synced ${count} contacts from WhatsApp for session ${sessionId}`);
        const io = getIO();
        io.to(`user:${userId}`).emit('whatsapp:contacts_synced', { sessionId, count });
      }
    } catch (error) {
      logger.error({ error }, `Error syncing contacts for session ${sessionId}`);
    }
  }

  private async handleChatsUpsert(sessionId: string, chats: any[]) {
    try {
      if (!Array.isArray(chats) || chats.length === 0) return;
      const session = await WhatsAppSession.findById(sessionId).select('userId');
      if (!session) return;
      const userId = session.userId;
      let count = 0;

      for (const chat of chats) {
        const jid = chat?.id || chat?.jid;
        if (!jid || typeof jid !== 'string' || jid.includes('@g.us') || !jid.includes('@s.whatsapp.net')) continue;
        const rawPhone = jid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
        if (!rawPhone || rawPhone.length < 7) continue;

        let normalizedPhone = normalizePhoneNumber(`+${rawPhone}`) || normalizePhoneNumber(rawPhone, 'PK');
        if (!normalizedPhone) normalizedPhone = `+${rawPhone}`;

        const name = chat.name || rawPhone;

        const contact = await Contact.findOneAndUpdate(
          { userId, normalizedPhoneNumber: normalizedPhone },
          {
            $setOnInsert: {
              userId,
              phoneNumber: rawPhone,
              normalizedPhoneNumber: normalizedPhone,
              source: 'WHATSAPP_SYNC'
            },
            $set: { name }
          },
          { upsert: true, returnDocument: 'after' }
        );

        await Chat.findOneAndUpdate(
          { userId, whatsappJid: jid },
          {
            $setOnInsert: { userId, sessionId, contactId: contact._id, whatsappJid: jid },
            $set: { 
              name,
              unreadCount: chat.unreadCount || 0
            }
          },
          { upsert: true }
        );

        count++;
      }

      if (count > 0) {
        logger.info(`Synced ${count} chats from WhatsApp for session ${sessionId}`);
        const io = getIO();
        io.to(`user:${userId}`).emit('whatsapp:contacts_synced', { sessionId, count });
      }
    } catch (error) {
      logger.error({ error }, `Error syncing chats for session ${sessionId}`);
    }
  }

  private async handleHistoryMessages(sessionId: string, messages: any[]) {
    try {
      if (!Array.isArray(messages) || messages.length === 0) return;
      const session = await WhatsAppSession.findById(sessionId).select('userId');
      if (!session) return;
      const userId = session.userId;

      for (const msg of messages) {
        const remoteJid = msg?.key?.remoteJid;
        if (!remoteJid || typeof remoteJid !== 'string' || remoteJid.includes('@g.us') || !remoteJid.includes('@s.whatsapp.net')) continue;
        const rawPhone = remoteJid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
        if (!rawPhone || rawPhone.length < 7) continue;

        let normalizedPhone = normalizePhoneNumber(`+${rawPhone}`) || normalizePhoneNumber(rawPhone, 'PK');
        if (!normalizedPhone) normalizedPhone = `+${rawPhone}`;

        const name = msg.pushName || rawPhone;

        const contact = await Contact.findOneAndUpdate(
          { userId, normalizedPhoneNumber: normalizedPhone },
          {
            $setOnInsert: {
              userId,
              phoneNumber: rawPhone,
              normalizedPhoneNumber: normalizedPhone,
              source: 'WHATSAPP_SYNC'
            },
            $set: { name }
          },
          { upsert: true, returnDocument: 'after' }
        );

        const chat = await Chat.findOneAndUpdate(
          { userId, whatsappJid: remoteJid },
          {
            $setOnInsert: { userId, sessionId, contactId: contact._id, whatsappJid: remoteJid },
            $set: { name }
          },
          { upsert: true, returnDocument: 'after' }
        );

        const content = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '[Media/Other]';
        const timestamp = msg.messageTimestamp ? new Date(msg.messageTimestamp * 1000) : new Date();

        await ChatMessage.findOneAndUpdate(
          { chatId: chat._id, whatsappMessageId: msg.key.id },
          {
            $setOnInsert: {
              chatId: chat._id,
              whatsappMessageId: msg.key.id,
              fromMe: !!msg.key.fromMe,
              content,
              timestamp
            }
          },
          { upsert: true }
        );

        // Update lastMessage on chat if this is newer
        if (!chat.lastMessageAt || chat.lastMessageAt < timestamp) {
          chat.lastMessage = content;
          chat.lastMessageAt = timestamp;
          await chat.save();
        }
      }
    } catch (error) {
      logger.error({ error }, `Error processing history messages for session ${sessionId}`);
    }
  }

  private async handleIncomingMessages(sessionId: string, data: any) {
    if (data.type !== 'notify') return;
    
    for (const msg of data.messages) {
      const remoteJid = msg.key.remoteJid;
      if (!remoteJid || remoteJid.includes('@g.us')) continue; // Skip groups
      
      const senderPhone = remoteJid.split('@')[0];
      const normalizedPhone = normalizePhoneNumber(`+${senderPhone}`);
      
      if (!normalizedPhone) continue;

      const content = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '[Media/Other]';

      try {
        const session = await WhatsAppSession.findById(sessionId).select('userId');
        if (!session) continue;

        // Save chat & chatMessage regardless of campaign
        const name = msg.pushName || senderPhone;
        const contact = await Contact.findOneAndUpdate(
          { userId: session.userId, normalizedPhoneNumber: normalizedPhone },
          {
            $setOnInsert: {
              userId: session.userId,
              phoneNumber: senderPhone,
              normalizedPhoneNumber: normalizedPhone,
              source: 'WHATSAPP_SYNC'
            },
            $set: { name }
          },
          { upsert: true, returnDocument: 'after' }
        );

        const chat = await Chat.findOneAndUpdate(
          { userId: session.userId, whatsappJid: remoteJid },
          {
            $setOnInsert: { userId: session.userId, sessionId, contactId: contact._id, whatsappJid: remoteJid },
            $set: { 
              name,
              lastMessage: content,
              lastMessageAt: new Date()
            }
          },
          { upsert: true, returnDocument: 'after' }
        );

        const chatMsg = await ChatMessage.findOneAndUpdate(
          { chatId: chat._id, whatsappMessageId: msg.key.id },
          {
            $setOnInsert: {
              chatId: chat._id,
              whatsappMessageId: msg.key.id,
              fromMe: !!msg.key.fromMe,
              content,
              timestamp: new Date()
            }
          },
          { upsert: true, returnDocument: 'after' }
        );

        // Notify client about new chat message
        const io = getIO();
        io.to(`user:${session.userId}`).emit('whatsapp:new_message', chatMsg);

        if (msg.key.fromMe) continue;

        const campaignContact = await CampaignContact.findOne({ contactId: contact._id })
          .sort({ createdAt: -1 });

        if (!campaignContact) continue;

        await Reply.create({
          campaignContactId: campaignContact._id,
          contactId: contact._id,
          content,
        });

        if (campaignContact.status !== 'REPLIED') {
          await CampaignContact.findByIdAndUpdate(campaignContact._id, {
            status: 'REPLIED',
            repliedAt: new Date(),
            replyMessage: content
          });

          await Campaign.findByIdAndUpdate(campaignContact.campaignId, {
            $inc: { repliedCount: 1 }
          });
        } else {
          await CampaignContact.findByIdAndUpdate(campaignContact._id, {
            $set: { replyMessage: campaignContact.replyMessage ? campaignContact.replyMessage + ' | ' + content : content }
          });
        }

        // Generate excel file after receiving a reply
        try {
          const { exportService } = await import('../services/export.service.js');
          await exportService.exportCampaign(campaignContact.campaignId.toString(), session.userId.toString());
          logger.info(`Generated excel for campaign ${campaignContact.campaignId} after receiving a reply`);
        } catch (err) {
          logger.error({ err }, 'Failed to generate excel file on reply');
        }
        
        io.to(`user:${session.userId}`).emit('whatsapp:reply', { 
          contactId: contact._id, 
          content,
          phone: contact.phoneNumber
        });

      } catch (error) {
        logger.error({ error }, `Error processing incoming message from ${senderPhone}`);
      }
    }
  }

  async sendMessage(sessionId: string, to: string, content: string, delay?: boolean) {
    if (delay) {
      await this.provider.sendTyping(sessionId, to);
    }
    return await this.provider.sendMessage(sessionId, to, content);
  }

  async disconnect(sessionId: string) {
    await this.provider.disconnect(sessionId);
    await WhatsAppSession.findByIdAndUpdate(sessionId, { status: 'DISCONNECTED' });
  }

  getStatus(sessionId: string) {
    return this.provider.getStatus(sessionId);
  }
  
  getQrCode(sessionId: string) {
    return this.provider.getQrCode(sessionId);
  }
}

export const whatsappService = new WhatsAppService();
