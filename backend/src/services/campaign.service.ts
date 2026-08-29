import Campaign from '../models/Campaign.js';
import CampaignContact from '../models/CampaignContact.js';
import Message from '../models/Message.js';
import { whatsappService } from '../whatsapp/service.js';
import { logger } from '../lib/logger.js';
import { getIO } from '../socket/index.js';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class CampaignService {
  private activeCampaigns = new Set<string>();

  async startCampaign(campaignId: string) {
    if (this.activeCampaigns.has(campaignId)) return;
    this.activeCampaigns.add(campaignId);

    const campaign = await Campaign.findById(campaignId).populate('whatsappSessionId');

    if (!campaign || campaign.status === 'COMPLETED' || campaign.status === 'STOPPED') {
      this.activeCampaigns.delete(campaignId);
      return;
    }

    const session: any = campaign.whatsappSessionId;
    if (session.status !== 'CONNECTED') {
      campaign.status = 'FAILED';
      await campaign.save();
      this.activeCampaigns.delete(campaignId);
      return;
    }

    campaign.status = 'RUNNING';
    campaign.startedAt = campaign.startedAt || new Date();
    await campaign.save();

    this.emitUpdate(campaign.userId.toString(), campaignId, { status: 'RUNNING' });

    try {
      await this.processCampaign(campaignId);
    } catch (error) {
      logger.error({ error }, `Error processing campaign ${campaignId}`);
      await Campaign.findByIdAndUpdate(campaignId, { status: 'FAILED' });
      this.emitUpdate(campaign.userId.toString(), campaignId, { status: 'FAILED' });
    } finally {
      this.activeCampaigns.delete(campaignId);
    }
  }

  async stopCampaign(campaignId: string) {
    this.activeCampaigns.delete(campaignId);
    await Campaign.findByIdAndUpdate(campaignId, { status: 'STOPPED' });
  }

  async pauseCampaign(campaignId: string) {
    this.activeCampaigns.delete(campaignId);
    await Campaign.findByIdAndUpdate(campaignId, { status: 'PAUSED' });
  }

  private async processCampaign(campaignId: string) {
    let hasMore = true;

    while (hasMore && this.activeCampaigns.has(campaignId)) {
      const campaign = await Campaign.findById(campaignId);
      if (!campaign || campaign.status !== 'RUNNING') break;

      const pendingContacts = await CampaignContact.find({
        campaignId,
        status: 'PENDING'
      }).populate('contactId').limit(10);

      if (pendingContacts.length === 0) {
        // Complete campaign
        campaign.status = 'COMPLETED';
        campaign.completedAt = new Date();
        await campaign.save();
        this.emitUpdate(campaign.userId.toString(), campaignId, { status: 'COMPLETED' });
        break;
      }

      for (const cc of pendingContacts) {
        if (!this.activeCampaigns.has(campaignId)) break;

        const contact: any = cc.contactId;

        // Skip opted out
        if (contact.isOptedOut) {
          await this.updateContactStatus(cc.id, campaignId, campaign.userId.toString(), 'SKIPPED');
          continue;
        }

        await this.updateContactStatus(cc.id, campaignId, campaign.userId.toString(), 'PROCESSING');

        try {
          const personalizedMsg = this.personalizeMessage(campaign.messageTemplate, contact);
          
          // Humanized delay between messages (3-8 seconds default)
          const waitMs = Math.floor(Math.random() * (campaign.delayMax - campaign.delayMin + 1) + campaign.delayMin) * 1000;
          await delay(waitMs);

          if (!this.activeCampaigns.has(campaignId)) {
             await this.updateContactStatus(cc.id, campaignId, campaign.userId.toString(), 'PENDING');
             break;
          }

          // Send message
          const messageId = await whatsappService.sendMessage(
            campaign.whatsappSessionId.toString(),
            contact.normalizedPhoneNumber,
            personalizedMsg,
            true // true for composing delay
          );

          if (messageId) {
            await Message.create({
              campaignContactId: cc._id,
              whatsappMessageId: messageId,
              direction: 'OUTBOUND',
              messageType: 'text',
              content: personalizedMsg,
              status: 'SENT',
              sentAt: new Date()
            });
            await this.updateContactStatus(cc.id, campaignId, campaign.userId.toString(), 'SENT', personalizedMsg);
          } else {
            throw new Error('No message ID returned');
          }
        } catch (error: any) {
          await CampaignContact.findByIdAndUpdate(cc.id, { status: 'FAILED', failureReason: error.message });
          await Campaign.findByIdAndUpdate(campaignId, { $inc: { failedCount: 1 } });
          
          this.emitUpdate(campaign.userId.toString(), campaignId, { 
            stats: await this.getCampaignStats(campaignId) 
          });
        }
      }
    }
  }

  private personalizeMessage(template: string, contact: any): string {
    return template
      .replace(/{name}/g, contact.name || 'Friend')
      .replace(/{phone}/g, contact.phoneNumber);
  }

  private async updateContactStatus(id: string, campaignId: string, userId: string, status: any, message?: string) {
    const data: any = { status };
    if (status === 'SENT') {
      data.sentAt = new Date();
      if (message) data.personalizedMessage = message;
    }

    await CampaignContact.findByIdAndUpdate(id, data);

    if (status === 'SENT' || status === 'SKIPPED' || status === 'FAILED') {
      const field = status === 'SENT' ? 'sentCount' : status === 'FAILED' ? 'failedCount' : 'totalContacts';
      const increment = status === 'SKIPPED' ? { pendingCount: -1, totalContacts: -1 } : { [field]: 1, pendingCount: -1 };
      
      await Campaign.findByIdAndUpdate(campaignId, { $inc: increment });
    }

    this.emitUpdate(userId, campaignId, { 
      stats: await this.getCampaignStats(campaignId) 
    });
  }

  private async getCampaignStats(campaignId: string) {
    const campaign = await Campaign.findById(campaignId).select('pendingCount sentCount deliveredCount repliedCount failedCount totalContacts');
    return campaign;
  }

  private emitUpdate(userId: string, campaignId: string, data: any) {
    getIO().to(`user:${userId}`).emit('campaignUpdate', { campaignId, ...data });
  }
}

export const campaignService = new CampaignService();
