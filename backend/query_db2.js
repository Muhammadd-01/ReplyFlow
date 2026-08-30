import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Campaign from './src/models/Campaign.js';
import WhatsAppSession from './src/models/WhatsAppSession.js';
import CampaignContact from './src/models/CampaignContact.js';

async function query() {
  await mongoose.connect(process.env.DATABASE_URL);
  const sessions = await WhatsAppSession.find();
  console.log("Sessions:", sessions.map(s => ({ id: s._id, status: s.status })));
  
  const campaigns = await Campaign.find().sort({ createdAt: -1 }).limit(3);
  console.log("\nRecent Campaigns:");
  for (const c of campaigns) {
    const contacts = await CampaignContact.find({ campaignId: c._id });
    const statuses = contacts.map(cc => cc.status).reduce((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {});
    console.log(`Campaign ${c._id} | Name: ${c.name} | Status: ${c.status} | pendingCount: ${c.pendingCount} | sentCount: ${c.sentCount}`);
    console.log(`  Contact statuses:`, statuses);
  }
  process.exit(0);
}
query();
