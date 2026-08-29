import fs from 'fs';

const servicePath = 'src/whatsapp/service.ts';
let code = fs.readFileSync(servicePath, 'utf8');

// Add imports
if (!code.includes("import Chat from '../models/Chat.js';")) {
  code = code.replace(
    "import Reply from '../models/Reply.js';",
    "import Reply from '../models/Reply.js';\nimport Chat from '../models/Chat.js';\nimport ChatMessage from '../models/ChatMessage.js';"
  );
}

// Update handleChatsUpsert
const handleChatsUpsertRegex = /private async handleChatsUpsert[\s\S]*?if \(count > 0\) \{/;
const newHandleChatsUpsert = `private async handleChatsUpsert(sessionId: string, chats: any[]) {
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

        let normalizedPhone = normalizePhoneNumber(\`+\${rawPhone}\`) || normalizePhoneNumber(rawPhone, 'PK');
        if (!normalizedPhone) normalizedPhone = \`+\${rawPhone}\`;

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
          { upsert: true, new: true }
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

      if (count > 0) {`;

code = code.replace(handleChatsUpsertRegex, newHandleChatsUpsert);


// Update handleHistoryMessages
const handleHistoryMessagesRegex = /private async handleHistoryMessages[\s\S]*?catch \(error\) \{/
const newHandleHistoryMessages = `private async handleHistoryMessages(sessionId: string, messages: any[]) {
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

        let normalizedPhone = normalizePhoneNumber(\`+\${rawPhone}\`) || normalizePhoneNumber(rawPhone, 'PK');
        if (!normalizedPhone) normalizedPhone = \`+\${rawPhone}\`;

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
          { upsert: true, new: true }
        );

        const chat = await Chat.findOneAndUpdate(
          { userId, whatsappJid: remoteJid },
          {
            $setOnInsert: { userId, sessionId, contactId: contact._id, whatsappJid: remoteJid },
            $set: { name }
          },
          { upsert: true, new: true }
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
    } catch (error) {`;

code = code.replace(handleHistoryMessagesRegex, newHandleHistoryMessages);


// Update handleIncomingMessages
const handleIncomingMessagesRegex = /private async handleIncomingMessages[\s\S]*?if \(!session\) continue;/;
const newHandleIncomingMessages = `private async handleIncomingMessages(sessionId: string, data: any) {
    if (data.type !== 'notify') return;
    
    for (const msg of data.messages) {
      const remoteJid = msg.key.remoteJid;
      if (!remoteJid || remoteJid.includes('@g.us')) continue; // Skip groups
      
      const senderPhone = remoteJid.split('@')[0];
      const normalizedPhone = normalizePhoneNumber(\`+\${senderPhone}\`);
      
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
          { upsert: true, new: true }
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
          { upsert: true, new: true }
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
          { upsert: true, new: true }
        );

        // Notify client about new chat message
        const io = getIO();
        io.to(\`user:\${session.userId}\`).emit('whatsapp:new_message', chatMsg);

        if (msg.key.fromMe) continue;`;

code = code.replace(handleIncomingMessagesRegex, newHandleIncomingMessages);

fs.writeFileSync(servicePath, code);
