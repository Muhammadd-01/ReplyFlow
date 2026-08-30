import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Campaign from './src/models/Campaign.js';
import CampaignContact from './src/models/CampaignContact.js';
import WhatsAppSession from './src/models/WhatsAppSession.js';

async function test() {
  await mongoose.connect(process.env.DATABASE_URL);
  
  const campaigns = await Campaign.find().sort({ createdAt: -1 }).limit(1);
  if (campaigns.length === 0) {
    console.log("No campaigns found");
    process.exit(0);
  }
  
  const campaign = campaigns[0];
  console.log("Campaign:", campaign);
  
  const pending = await CampaignContact.find({ campaignId: campaign._id, status: 'PENDING' });
  const processing = await CampaignContact.find({ campaignId: campaign._id, status: 'PROCESSING' });
  const sent = await CampaignContact.find({ campaignId: campaign._id, status: 'SENT' });
  const failed = await CampaignContact.find({ campaignId: campaign._id, status: 'FAILED' });
  
  console.log(`Contacts: PENDING=${pending.length}, PROCESSING=${processing.length}, SENT=${sent.length}, FAILED=${failed.length}`);
  if (failed.length > 0) {
    console.log("First failed reason:", failed[0].failureReason);
  }
  process.exit(0);
}
test();
