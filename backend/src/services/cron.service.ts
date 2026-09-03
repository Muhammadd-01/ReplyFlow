import cron from 'node-cron';
import CampaignContact from '../models/CampaignContact.js';
import Campaign from '../models/Campaign.js';
import { exportService } from './export.service.js';
import { logger } from '../lib/logger.js';

class CronService {
  public init() {
    // Run every hour
    cron.schedule('0 * * * *', async () => {
      logger.info('Running NO_REPLY check cron job');
      try {
        const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        
        // Find contacts that were sent/delivered more than 2 days ago and haven't replied
        const noReplies = await CampaignContact.find({
          status: { $in: ['SENT', 'DELIVERED'] },
          sentAt: { $lt: twoDaysAgo }
        });

        if (noReplies.length > 0) {
          logger.info(`Found ${noReplies.length} contacts with no reply after 2 days.`);
          
          const campaignIds = new Set<string>();

          for (const contact of noReplies) {
            contact.status = 'DIDNT_REPLY';
            await contact.save();
            campaignIds.add(contact.campaignId.toString());
          }

          // Generate excel file for each affected campaign
          for (const campaignId of campaignIds) {
            const campaign = await Campaign.findById(campaignId);
            if (campaign) {
              await exportService.exportCampaign(campaignId, campaign.userId.toString());
              logger.info(`Generated excel for campaign ${campaignId} due to DIDNT_REPLY updates`);
            }
          }
        }
      } catch (error) {
        logger.error({ error }, 'Error in NO_REPLY cron job');
      }
    });
  }
}

export const cronService = new CronService();
