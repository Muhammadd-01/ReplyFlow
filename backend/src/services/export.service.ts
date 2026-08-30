import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs/promises';
import { env } from '../config/env.js';
import Campaign from '../models/Campaign.js';
import CampaignContact from '../models/CampaignContact.js';
import Message from '../models/Message.js';
import Reply from '../models/Reply.js';

class ExportService {
  async exportCampaign(campaignId: string, userId: string): Promise<string> {
    const campaign = await Campaign.findOne({ _id: campaignId, userId }).populate('whatsappSessionId');
    if (!campaign) throw new Error('Campaign not found');

    const ccs = await CampaignContact.find({ campaignId }).populate('contactId').lean();
    
    const ccIds = ccs.map((cc: any) => cc._id);
    const contactIds = ccs.map((cc: any) => (cc.contactId as any)._id);
    
    const [messages, replies] = await Promise.all([
      Message.find({ campaignContactId: { $in: ccIds } }).lean(),
      Reply.find({ contactId: { $in: contactIds } }).lean()
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ReplyFlow';
    workbook.created = new Date();

    // Sheet 1: Campaign Info
    const infoSheet = workbook.addWorksheet('Campaign Info');
    infoSheet.columns = [
      { header: 'Property', key: 'prop', width: 20 },
      { header: 'Value', key: 'val', width: 50 }
    ];
    infoSheet.addRows([
      { prop: 'Campaign Name', val: campaign.name },
      { prop: 'Status', val: campaign.status },
      { prop: 'Total Contacts', val: campaign.totalContacts },
      { prop: 'Sent', val: campaign.sentCount },
      { prop: 'Delivered', val: campaign.deliveredCount },
      { prop: 'Replied', val: campaign.repliedCount },
      { prop: 'Failed', val: campaign.failedCount },
      { prop: 'Created At', val: (campaign as any).createdAt.toISOString() },
    ]);

    // Sheet 2: Contacts Status
    const contactsSheet = workbook.addWorksheet('Contacts Details');
    contactsSheet.columns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Phone Number', key: 'phone', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Sent At', key: 'sentAt', width: 25 },
      { header: 'Reply Message', key: 'reply', width: 40 },
      { header: 'Failure Reason', key: 'failure', width: 30 },
    ];

    const messagesData: any[] = [];
    const repliesData: any[] = [];

    ccs.forEach((cc: any) => {
      contactsSheet.addRow({
        name: cc.contactId?.name || '',
        phone: cc.contactId?.phoneNumber,
        status: cc.status,
        sentAt: cc.sentAt ? cc.sentAt.toISOString() : '',
        reply: cc.replyMessage || '',
        failure: cc.failureReason || ''
      });

      const myMessages = messages.filter((m: any) => m.campaignContactId.toString() === cc._id.toString());
      myMessages.forEach((m: any) => {
        messagesData.push({
          phone: cc.contactId?.phoneNumber,
          content: m.content,
          status: m.status,
          sentAt: m.sentAt ? m.sentAt.toISOString() : ''
        });
      });

      const myReplies = replies.filter((r: any) => r.contactId.toString() === cc.contactId._id.toString());
      myReplies.forEach((r: any) => {
        repliesData.push({
          phone: cc.contactId?.phoneNumber,
          content: r.content,
          receivedAt: r.createdAt.toISOString()
        });
      });
    });

    // Sheet 3: Messages Sent
    const messagesSheet = workbook.addWorksheet('Outbound Messages');
    messagesSheet.columns = [
      { header: 'Phone Number', key: 'phone', width: 20 },
      { header: 'Message Content', key: 'content', width: 50 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Sent At', key: 'sentAt', width: 25 },
    ];
    messagesSheet.addRows(messagesData);

    // Sheet 4: Replies Received
    const repliesSheet = workbook.addWorksheet('Replies');
    repliesSheet.columns = [
      { header: 'Phone Number', key: 'phone', width: 20 },
      { header: 'Reply Content', key: 'content', width: 50 },
      { header: 'Received At', key: 'receivedAt', width: 25 },
    ];
    repliesSheet.addRows(repliesData);

    await fs.mkdir(env.EXPORT_DIR, { recursive: true });
    
    const filename = `campaign_export_${campaignId}_${Date.now()}.xlsx`;
    const filepath = path.join(env.EXPORT_DIR, filename);
    
    await workbook.xlsx.writeFile(filepath);
    
    return filename;
  }
}

export const exportService = new ExportService();
